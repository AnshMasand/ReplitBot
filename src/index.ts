import dotenv from "dotenv";
dotenv.config();

import { Telegraf } from "telegraf";
import { downloadVoiceFile } from "./lib/downloadVoiceFile.ts";
import { postToWhisper } from "./lib/postToWhisper.ts";
import { textToSpeech } from "./lib/htApi.ts";
import { textToSpeech1 } from "./lib/htApiv2.ts";
import { createReadStream, existsSync, mkdirSync } from "fs";
import { Model as ChatModel } from "./models/chat.ts";
import { Model as ChatWithTools } from "./models/chatWithTools.ts";

const workDir = "./tmp";
const telegramToken = process.env.TELEGRAM_TOKEN!;

const bot = new Telegraf(telegramToken);
let model = new ChatWithTools();

if (!existsSync(workDir)) {
  mkdirSync(workDir);
}

bot.start((ctx) => {
  ctx.reply(
    "Hey welcome to HansonAI! an Influencer AI Bot that can talk to you about the world of AI. Ask me about building AI software. "
  );
});

bot.help((ctx) => {
  ctx.reply("Send me a message and I will echo it back to you.");
});

bot.on("voice", async (ctx) => {
  if (
    process.env.SERVE_THIS_USER_ONLY &&
    parseInt(process.env.SERVE_THIS_USER_ONLY) !== ctx.message.chat.id
  ) {
    console.log(
      `User ${ctx.message.chat.id.toString()} is not allowed to be served.`
    );
    await ctx.reply("Sorry, you're not allowed to be served by me.");
    return;
  }

  const voice = ctx.message.voice;
  await ctx.sendChatAction("typing");

  let localFilePath;

  try {
    localFilePath = await downloadVoiceFile(workDir, voice.file_id, bot);
  } catch (error) {
    console.log(error);
    await ctx.reply(
      "Whoops! There was an error while downloading the voice file. Maybe ffmpeg is not installed?"
    );
    return;
  }

  const transcription = await postToWhisper(model.openai, localFilePath);

  await ctx.reply(`Transcription: ${transcription}`);
  await ctx.sendChatAction("typing");

  let responses;
  try {
    responses = await model.call(transcription, ctx);
  } catch (error) {
    console.log(error);
    await ctx.reply(
      "Whoops! There was an error while talking to OpenAI. See logs for details."
    );
    return;
  }

  for (const message of responses) {
    console.log(message);
    await ctx.reply(message, { parse_mode: "HTML" });
  }
  // console.log(response);

  // await ctx.reply(response, { parse_mode: "HTML" });

  try {
    const responseTranscriptionPath = await textToSpeech1(responses.join(" "));
    await ctx.sendChatAction("typing");
    await ctx.replyWithVoice({
      source: createReadStream(responseTranscriptionPath),
      filename: localFilePath,
    });
  } catch (error) {
    console.log(error);
    await ctx.reply(
      "Whoops! There was an error while synthesizing the response via play.ht. See logs for details."
    );
  }
});

bot.on("message", async (ctx) => {
  const text = (ctx.message as any).text;

  if (!text) {
    ctx.reply("Please send a text message.");
    return;
  }

  console.log("Input: ", text);

  await ctx.sendChatAction("typing");
  try {
    const messages = await model.call(text, ctx);
    for (const message of messages) {
      await ctx.reply(message, { parse_mode: "HTML" });
    }
  } catch (error) {
    console.log(error);

    const message = JSON.stringify(
      (error as any)?.response?.data?.error ?? "Unable to extract error"
    );

    console.log({ message });

    await ctx.reply(
      "Whoops! There was an error while talking to OpenAI. Error: " + message
    );
  }
});

bot.launch().then(() => {
  console.log("Bot launched");
});

process.on("SIGTERM", () => {
  bot.stop();
});
