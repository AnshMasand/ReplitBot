import { config } from 'dotenv';
config();
if (!process.env.PINECONE_INDEX) {
    throw new Error('Missing Pinecone index name in .env file');
}

  
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX?? '';
console.log(PINECONE_INDEX_NAME+"index name");
  
const PINECONE_NAME_SPACE = 'chatchat12'; //optional
console.log(PINECONE_NAME_SPACE+" namespace");
  
export { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE };
  