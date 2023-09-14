import { DynamicTool } from "langchain/tools";
import { makeChain } from "../../utils/makechain.ts";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '../../utils/pinecone-client.ts';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '../../config/pinecone.ts';
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import {
  JSONLoader,
  JSONLinesLoader,
} from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { PDFLoader } from "langchain/document_loaders";

export const convretqna = new DynamicTool({
  name: "Hanson Cheng youtube video ( How to design your life ) & Golden Quail Menu Options",
  description:
    "This tool contains information on How to Design your life by Hanson Cheng",
  func: async(question: string) => {
    try {
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

    /*vectorstore instance*/
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({}),
      {
        pineconeIndex: index,
        textKey: 'text',
        namespace: PINECONE_NAME_SPACE, 
      },
    );

    //chain
    const chain = makeChain(vectorStore);
    //Ask a question using chat history
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: [],
    });

    console.log('response', response);
    return JSON.stringify({
      response
    })
  } catch (error: any) {
    console.log('error', error);
    return error;
  }
}});


