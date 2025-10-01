import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

const getPineconeClient = () => {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
};

export const getPineconeIndex = () => {
  const client = getPineconeClient();
  // Ensure you have a Pinecone index named 'quizforge'
  return client.Index('quizforge');
};