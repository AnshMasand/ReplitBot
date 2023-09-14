import dotenv from "dotenv";
dotenv.config();

import { Telegraf } from "telegraf";

import { createReadStream, existsSync, mkdirSync } from "fs";


const workDir = "./tmp";
const telegramToken = process.env.TELEGRAM_TOKEN!;

const bot = new Telegraf(telegramToken);


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

bot.on("message", async (ctx) => {
  const text = (ctx.message as any).text;

  if (!text) {
    ctx.reply("Please send a text message.");
    return;
  }

  console.log("Input: ", text);

  await ctx.sendChatAction("typing");

    const messages = "hi";
    await ctx.reply(messages);

    console.log({ messages });

});

bot.launch().then(() => {
  console.log("Bot launched");
});

process.on("SIGTERM", () => {
  bot.stop();
});
