import { DynamicTool } from "langchain/tools";
import { makeChain } from "../../utils/makechain.ts";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '../../utils/pinecone-client.ts';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '../../config/pinecone.ts';
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { BaseLLM } from "langchain/llms";


export const conversationAnalyzer = new DynamicTool({
  name: "Must Use Conversation Analyzer",
  description:
    "AI must always use this tool to help better understand the context of the question to reply",
  func: async(question: string) => {
    try {
        const model = new OpenAI({ temperature: 0 });
        const prompt = PromptTemplate.fromTemplate(
          "You are a secondary AI, your job is to analyze the humans messages and understand what stage of the conversation they are in, then output a helpful message to guide the original AI."
        );
        const chainA = new LLMChain({ llm: model, prompt });
        
        // The result is an object with a `text` property.
        const resA = await chainA.call({ question });
        console.log({ resA });
    
    return JSON.stringify({
      resA
    })
  } catch (error: any) {
    console.log('error', error);
    return error;
  }
}});


