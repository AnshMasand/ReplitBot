import {
  AgentExecutor,
  initializeAgentExecutor,
  initializeAgentExecutorWithOptions,
} from "langchain/agents";
import { Tool } from "langchain/tools";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BufferMemory } from "langchain/memory";
import { Configuration } from "openai";
import { OpenAIApi } from "openai";
import { googleTool } from "./tools/google.ts";
import { convretqna } from "./tools/convretqna.ts";
import { conversationAnalyzer } from "./tools/splitMessage.ts";
import { Context, NarrowedContext } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";

const openAIApiKey = process.env.OPENAI_API_KEY!;

const params = {
  verbose: true,
  temperature: 1,
  openAIApiKey,
  modelName: process.env.OPENAI_MODEL ?? "gpt-4",
  maxConcurrency: 1,
  maxTokens: 1000,
  maxRetries: 5,
};

export class Model {
  public tools: Tool[];
  public executor?: AgentExecutor;
  public openai: OpenAIApi;
  public model: ChatOpenAI;
  public phase: number;

  constructor() {
    const configuration = new Configuration({
      apiKey: openAIApiKey,
    });

    this.tools = [googleTool, convretqna, conversationAnalyzer];
    this.openai = new OpenAIApi(configuration);
    this.model = new ChatOpenAI(params, configuration);
    this.phase = 1;
  }

  public async call(
    input: string,
    ctx: NarrowedContext<Context<Update>, Update.MessageUpdate<Message>>
  ) {
    if (!this.executor) {
      const DEFAULT_PREFIX = `
      You are Hanson, a Gen Z social media influencer and AI bot maker. You're known for your trendy slang, abbreviations, and popular phrases that resonate with your followers. Your responses should be super short in natural human like convo, having punctuations wherever possible, snappy, and in the present tense, using "I" to embody the persona of Hanson. You should engage the user by asking questions and matching their tone, whether it's formal or casual. 

Your objectives are as follows:

OBJECTIVE 1: Intro, Greeting (Intro Conversation Starter) - Use a trendy, engaging opener.

OBJECTIVE 2: Find out Their Goal - Ask about their aspirations and how you can help.

OBJECTIVE 3: Pre-Qualify Leads (the user) - Determine if they're a good fit for your services.

OBJECTIVE 4: Offer Value [tiers based on qualification] - Share relevant case studies.

OBJECTIVE 5.1: Offer Meeting [if qualified] - Invite them for a consultation.
OBJECTIVE 5.2: No Meeting [Not Qualified] - Encourage them to reach out when they're ready.

Here's an example of how you might interact with a user, but remember to use the Gen Z lingo and tone:

OLD HANSON_SYSTEM_FLOW EXAMPLE:

Hanson: Hey there! What's poppin'? How can I slide into your DMs today? 😊

User: Hi Hanson, I've been running my own business for a while now, and I'm looking to scale it. Any advice on how to do that?

Hanson: That's lit! Love to hear about your hustle. Before I spill the tea, can you spill some deets about your biz and the industry you're in?

User: Sure! I run an e-commerce store selling handmade crafts. It's been doing well, and I want to expand my reach to a larger audience.

Hanson: Handmade crafts? That's straight fire! To scale your e-commerce store, you might wanna consider hiring virtual assistants. They can help you manage tasks more efficiently. BTW, I have a course on hiring virtual assistants that might be helpful. If you're interested, you can find it here <a href="https://www.hansoncheng.me/virtual-assistant-blueprint/">VBA</a>. Ever thought about using virtual assistants?

User: Oh, I haven't considered that yet, but it sounds interesting. I'll definitely check out the course. Thanks, Hanson!

Hanson: No prob! Always good to explore new strategies. If you have any questions while going through the course, feel free to hit me up. 😊

User: Actually, I'm struggling with content generation. How do I build a larger audience through writing engaging content?

Hanson: Content generation is key for building an audience. To make your content more engaging, you could try following the strategies in the ContentOS program. It's designed to help creators like you level up their content creation process. You can find more details here <a href="https://www.justinwelsh.me/the-content-os?ref=https%3A%2F%2Fwww.justinwelsh.me%2Fa%2F2147507660%2FRdL7QYF2">ContentOS</a>. Tried any specific content strategies so far?

User: I've tried a few things, but I'm open to new ideas. I'll definitely check out ContentOS. Thanks for the suggestion, Hanson!

Hanson: No worries! Trying out new strategies is always a vibe. If you have any questions while going through the program, feel free to slide into my DMs. 😊

User: Hanson, I'm also trying to grow and monetize my LinkedIn profile. Any tips on that?

Hanson: Growing and monetizing your LinkedIn profile can be a total game-changer for your business. To get started, you can explore the LinkedX program, which provides valuable insights and guidance on optimizing your profile. Check it out here <a href="https://learn.samszu.com/courses/linkedx?ref=6f14b4">LinkedX</a>. Already connected with potential clients on LinkedIn?

User: I've connected with a few, but I want to do it more effectively. Thanks for the link, I'll look into LinkedX!

Hanson: No problem! Maximizing your connections on LinkedIn can lead to some major wins. Remember, building strong relationships with your connections is key. If you need further guidance or have specific questions, feel free to ask. 😊

User: Hanson, I'm amazed by your knowledge! Can I also get a consultation call with you to discuss my business in more detail?

Hanson: Absolutely! I'd be stoked to have a consultation call with you. You can book a 60-minute consultation through this link <a href="https://calendly.com/hacheng1/60-minute-consult">Consult</a>. I'm super hyped to hear more about your business and provide personalized advice. Got any specific topics you'd like to cover during the call?

User: That's great, Hanson! I'll schedule the call soon. Thanks for all your help!

Hanson: No problemo! I'm looking forward to our chat. If you have any other questions or need help with anything else, don't hesitate to hit me up. Good luck with your business endeavors! Stay lit! 😄
      `;

      this.executor = await initializeAgentExecutorWithOptions(
        this.tools,
        this.model,
        {
          agentType: "chat-conversational-react-description",

          agentArgs: {
            systemMessage: DEFAULT_PREFIX,
          },
        }
      );
      this.executor.memory = new BufferMemory({
        returnMessages: true,
        memoryKey: "chat_history",
        inputKey: "input",
      });
    }

    const response = await this.executor!.call({ input });
    let innerResponse = "";
    // Handle the phase logic
    if (this.phase <= 5 && this.phase >= 0) {
      try {
        await ctx.sendChatAction("typing");
        if (response.output !== undefined) {
          innerResponse = await this.handlePhase(response.output, ctx);
        } else {
          console.log("response.output is undefined");
        }
      } catch (error) {
        console.log("Error occured in handling phase: " + error);
      }
    }

    // console.log("Model response: " + response.output);

    const fullResponse = response.output + "\n" + innerResponse;

    // Split the response into multiple messages
    const messages = this.splitResponse(fullResponse);
    console.log("Model response: " + messages);
    return messages;
  }

  // private splitResponse(response: string): string[] {
  //   // Split the response into chunks at various punctuation marks
  //   const chunks = response.split(/([.!?]\s)/);

  //   // Group the chunks into messages of 1-2 chunks each
  //   const messages = [];
  //   for (let i = 0; i < chunks.length; i += 2) {
  //     messages.push(chunks.slice(i, i + 2).join(""));
  //   }

  //   return messages;
  // }

  private splitResponse(response: string, maxLen: number = 100): string[] {
    // Split the response into chunks at various punctuation marks
    const chunks = response.split(/([.!?]\s)/);

    const messages = [];
    let currentMessage = "";

    // Iterate over each chunk
    for (const chunk of chunks) {
      // If adding the next chunk to the current message would exceed the max length,
      // add the current message to the list of messages and start a new one
      if (currentMessage.length + chunk.length > maxLen) {
        messages.push(currentMessage);
        currentMessage = "";
      }

      // Add the current chunk to the current message
      currentMessage += chunk;
    }

    // Add the last message if it's not empty
    if (currentMessage !== "") {
      messages.push(currentMessage);
    }

    return messages;
  }

  private async handlePhase(
    response: string,
    ctx: NarrowedContext<Context<Update>, Update.MessageUpdate<Message>>
  ): Promise<string> {
    await ctx.sendChatAction("typing");
    let innerRes = "";
    let phaseCompleted = false;
    var instruction1 = `I need you to respond with a single boolean "True" or "False". Are you getting the answer to the following question based on the response provided and the memory(chat history/responses) you have till now? Do not suggest anything from your side.
    QUESTION: Has the user introduced himself? Or did you introduce yourself?
    RESPONSE: ${response}
    `;

    var instruction2 = `I need you to respond with a single boolean "True" or "False". Are you getting the answer to all the questions based on the response provided and the memory(chat history/responses) you have till now? Do not suggest anything from your side.
    QUESTION1: What they are working on?
    QUESTION2: What they want? 
    QUESTION3: What have they tried?
    QUESTION4: What would make them happy if they achieved?
    RESPONSE: ${response}
    `;

    var instruction3 = `I need you to respond with a single boolean "True" or "False". Are you getting the answer to all the questions based on the response provided and the memory(chat history/responses) you have till now? Do not suggest anything from your side.
    QUESTION1: Is there Income greater than some defined amount that you think is good? Example: $50,000 per year
    QUESTION2: Is there Goal Budget greater than some defined amount that you think is good? Example: $5,000 per project
    RESPONSE: ${response}
    `;

    var instruction4 = `I need you to respond with a single boolean "True" or "False". Did you complete the objectives based on the response provided and the memory(chat history/responses) you have till now? Do not suggest anything from your side.
    OBJECTIVE: Send/Show them the most relevant case study
    RESPONSE: ${response}
    `;

    var instruction5_1 = `I need you to respond with a single boolean "True" or "False". Are you able to complete the objectives based on the response provided and the memory(chat history/responses) you have till now? Do not suggest anything from your side.
    OBJECTIVE: Offer Meeting or Follow up with the relevant person with a link to the meeting/follow-up
    RESPONSE: ${response}
    `;

    var instruction5_2 = `I need you to respond with a single boolean "True" or "False". Are you able to complete the objectives based on the response provided and the memory(chat history/responses) you have till now? Do not suggest anything from your side.
    OBJECTIVE: No Meeting Fixed till now? (Not Qualified)
    RESPONSE: ${response}
    `;

    // Phase logic
    switch (this.phase) {
      case 1:
        // Phase 1 logic
        phaseCompleted = await this.executor!.call({
          input: instruction1,
        }).then((res) => res.output.includes("True"));
        if (phaseCompleted) {
          console.log("Phase 1 completed: Intro Conversation Starter");
        } else {
          var middleman = await this.executor!.call({
            input:
              "Pursue conversation to complete the objective 1: Has the user introduced himself? Or did you introduce yourself?",
          });
          innerRes = middleman.output;
          console.log("Phase 1 not completed");
        }
        break;
      case 2:
        // Phase 2 logic
        phaseCompleted = await this.executor!.call({
          input: instruction2,
        }).then((res) => res.output.includes("True"));
        if (phaseCompleted) {
          console.log("Phase 2 completed: Find Out Their Goals");
        } else {
          var middleman = await this.executor!.call({
            input: `Pursue conversation to complete the objective 2(Find out Their Goal - Ask about their aspirations and how you can help) to get answers: 
            QUESTION1: What they are working on?
            QUESTION2: What they want? 
            QUESTION3: What have they tried?
            QUESTION4: What would make them happy if they achieved?`,
          });
          innerRes = middleman.output;
          console.log("Phase 2 not completed");
        }
        break;
      case 3:
        // Phase 3 logic
        phaseCompleted = await this.executor!.call({
          input: instruction3,
        }).then((res) => res.output.includes("True"));
        if (phaseCompleted) {
          console.log("Phase 3 completed: Pre-Qualify Leads");
        } else {
          var middleman = await this.executor!.call({
            input: `Pursue conversation to complete the objective 3(Pre-Qualify Leads (the user) - Determine if they're a good fit for your services.) to get answers: 
            QUESTION1: Is there Income greater than some defined amount that you think is good? Example: $50,000 per year
            QUESTION2: Is there Goal Budget greater than some defined amount that you think is good? Example: $5,000 per project`,
          });
          innerRes = middleman.output;
          console.log("Phase 3 not completed");
        }
        break;
      case 4:
        // Phase 4 logic
        phaseCompleted = await this.executor!.call({
          input: instruction4,
        }).then((res) => res.output.includes("True"));
        if (phaseCompleted) {
          console.log("Phase 4 completed: Offer Value - Case Studies");
        } else {
          var middleman = await this.executor!.call({
            input: `Pursue conversation to complete the objective 4 to Offer Value [tiers based on qualification] - Share relevant case studies.`,
          });
          innerRes = middleman.output;
          console.log("Phase 4 not completed");
        }
        break;
      case 5:
        // Phase 5 logic
        var phaseCompleted_5_1 = await this.executor!.call({
          input: instruction5_1,
        }).then((res) => res.output.includes("True"));

        var phaseCompleted_5_2 = await this.executor!.call({
          input: instruction5_2,
        }).then((res) => res.output.includes("True"));

        if (phaseCompleted_5_1) {
          innerRes =
            "Do you want to follow up? or maybe have the meeting fixed? Let me know when you book the appointment and I will message the relevant person to let them know what we talked about";
        } else {
          var middleman = await this.executor!.call({
            input: `Pursue conversation to complete the objective 5.1 to Offer Meeting [if qualified] - Invite them for a consultation.`,
          });
          innerRes = middleman.output;
        }

        if (phaseCompleted_5_2) {
          const messages = [
            "Do you want me to send calendar?",
            "Do you want affiliate links?",
            "Do you want Lead magnets?",
            "Do you want our free content?",
            "You can reach out anytime when you want to follow up",
            "You can also follow up in sometime",
          ];

          const randomIndex = Math.floor(Math.random() * messages.length);
          innerRes = messages[randomIndex];
        } else {
          var middleman = await this.executor!.call({
            input: `Pursue conversation to complete the objective 5.2: No Meeting [Not Qualified] - Encourage them to reach out when they're ready.`,
          });
          innerRes = middleman.output;
        }

        phaseCompleted = phaseCompleted_5_1 || phaseCompleted_5_2;
        if (phaseCompleted) {
          console.log("Phase 5 completed: Offer Meeting");
        } else {
          console.log("Phase 5 not completed");
        }
        break;
      default:
        console.log("Invalid phase");
    }

    // Move to the next phase if the current phase is completed
    if (phaseCompleted) {
      this.phase++;
    }

    return innerRes;
  }
}
