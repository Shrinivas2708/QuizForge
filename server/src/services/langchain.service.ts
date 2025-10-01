import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { CloudflareWorkersAIEmbeddings } from "@langchain/cloudflare";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineconeStore } from "@langchain/pinecone";
import { getPineconeIndex } from "./pinecone.service";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { AppEnv } from "../types";

// --- Models ---
// 🧠 Gemini for Chat and Quiz Generation (High-Quality Generation)
const getChatModel = (env: AppEnv["Bindings"]) => new ChatGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
  model: "gemini-2.5-flash",
  temperature: 0.7,
});

// --- Embeddings ---
// 💸 Free Cloudflare model for Embeddings (Cost-Effective)
const getEmbeddingsModel = (env: AppEnv["Bindings"]) => new CloudflareWorkersAIEmbeddings({
  binding: env.AI,
  model: "@cf/baai/bge-base-en-v1.5", // Produces 384-dimension vectors
});


// --- Document Processing and Embedding ---
export const processAndEmbedDocument = async (env: AppEnv["Bindings"], content: string, sourceId: string, userId: string) => {
    const embeddings = getEmbeddingsModel(env);
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const docs = await textSplitter.createDocuments([content]);

    const pineconeIndex = getPineconeIndex();

    const documentsWithMetadata = docs.map(doc => ({
        ...doc,
        metadata: { ...doc.metadata, sourceId, userId }
    }));

    // Ensure your Pinecone index is configured for 384 dimensions
    await PineconeStore.fromDocuments(documentsWithMetadata, embeddings, {
        pineconeIndex,
        maxConcurrency: 5,
    });
    
    return documentsWithMetadata;
};


// --- Quiz Generation (using Gemini) ---
const quizSchema = z.object({
  questions: z.array(
    z.object({
      questionText: z.string().describe("The main text of the question."),
      questionType: z.enum(["multiple_choice", "true_false"]).describe("The type of the question."),
      data: z.object({
        options: z.array(z.string()).optional().describe("An array of possible answers for multiple_choice."),
        correctAnswer: z.string().describe("The correct answer to the question."),
      }).describe("Holds the options and the correct answer."),
      feedback: z.string().describe("An explanation for why the correct answer is right."),
    })
  ).describe("An array of quiz questions."),
});
const quizParser = StructuredOutputParser.fromZodSchema(quizSchema);

export const generateQuizFromContent = async (env: AppEnv["Bindings"], sourceContent: string, config: any) => {
  const model = getChatModel(env);
  const formatInstructions = quizParser.getFormatInstructions();
  const prompt = new PromptTemplate({
    template: `
      You are an expert quiz creator. Given the source material, generate a quiz with {questionCount} questions of {difficulty} difficulty.
      Include these question types: {questionTypes}.

      Source Material:
      ----------------
      {sourceContent}
      ----------------

      {format_instructions}
    `,
    inputVariables: ["sourceContent", "questionCount", "difficulty", "questionTypes"],
    partialVariables: { format_instructions: formatInstructions },
  });

  const chain = prompt.pipe(model).pipe(quizParser);

  const response = await chain.invoke({
    sourceContent,
    questionCount: config.questionCount || 10,
    difficulty: config.difficulty || "medium",
    questionTypes: config.questionTypes?.join(", ") || "multiple_choice, true_false",
  });

  return response.questions;
};


// --- RAG Chat Functionality (using Cloudflare Embeddings + Gemini Chat) ---
export const getRAGChatResponse = async (
    env: AppEnv["Bindings"], 
    question: string, 
    sourceIds: string[], // Accepts multiple source IDs
    userId: string,
    chatHistory: string // Accepts formatted chat history
) => {
    const model = getChatModel(env);
    const embeddings = getEmbeddingsModel(env);
    const pineconeIndex = getPineconeIndex();
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex });

    // MODIFIED: The retriever now filters for any of the source IDs provided
    const retriever = vectorStore.asRetriever({
        k: 6,
        filter: { 
            userId,
            sourceId: { "$in": sourceIds } 
        }
    });
    
    // This prompt helps rephrase a follow-up question to be standalone
    const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

    Chat History:
    {chat_history}
    Follow Up Input: {question}
    Standalone question:`);

    const ANSWER_PROMPT = PromptTemplate.fromTemplate(`You are an expert on the provided documents. Answer the question based only on the following context.

    Context:
    {context}
    
    Question: {question}
    Answer:`);
    
    const conversationalRetrievalChain = RunnableSequence.from([
        {
            // This step gets the standalone question
            standalone_question: RunnableSequence.from([
                {
                    question: (input) => input.question,
                    chat_history: (input) => input.chat_history,
                },
                CONDENSE_QUESTION_PROMPT,
                model,
                new StringOutputParser(),
            ]),
            // The original question and chat history are passed through
            original_input: (input) => input,
        },
        {
            // The standalone question is used to retrieve context
            context: ({ standalone_question }) => retriever.pipe(formatDocumentsAsString).invoke(standalone_question),
            // The original question is what the final LLM will answer
            question: ({ original_input }) => original_input.question,
        },
        ANSWER_PROMPT,
        model,
        new StringOutputParser(),
    ]);
    
    const result = await conversationalRetrievalChain.invoke({
        question,
        chat_history: chatHistory,
    });
    
    return result;
}
