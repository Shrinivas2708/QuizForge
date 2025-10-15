// services/intent.service.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { AppEnv } from "../types";

const getIntentModel = (env: AppEnv["Bindings"]) => new ChatGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
  model: "gemini-2.0-flash-exp",
  temperature: 0.1, 
});

export type UserIntent = 
  | 'quiz_request'       
  | 'quiz_start'          
  | 'content_question'    
  | 'new_document'       
  | 'platform_question'   
  | 'out_of_scope'        
  | 'greeting';           

const INTENT_CLASSIFICATION_PROMPT = PromptTemplate.fromTemplate(`You are an intent classifier for a quiz generation platform. Users upload documents and can generate quizzes, ask questions about content, or get help.

Analyze the user's message and classify it into ONE of these intents:
- quiz_request: User wants to generate a new quiz or regenerate existing quiz (e.g., "make a quiz", "generate questions", "create a new quiz", "harder questions")
- quiz_start: User is ready to take/start the quiz (e.g., "start quiz", "let's begin", "take the test")
- content_question: User is asking a question related to the uploaded document's content. This includes summaries, definitions, or general explanations about the topic. (e.g., "what does chapter 3 say about...", "explain this concept", "tell me more about quantum physics", "summarize the key points")
- new_document: User wants to upload a different document (e.g., "new file", "different document", "upload another")
- platform_question: User needs help with the platform (e.g., "how do I...", "what can you do")
- greeting: Simple greeting or small talk (e.g., "hello", "how are you")
- out_of_scope: Unrelated to the platform or the document's content (e.g., "what's the weather", "tell me a joke")

User message: "{message}"

Context:
- Has uploaded document: {hasDocument}
- Has generated quiz: {hasQuiz}
- Document is ready: {documentReady}

Respond with ONLY the intent name, nothing else.`);

export const classifyIntent = async (
  env: AppEnv["Bindings"],
  message: string,
  context: {
    hasDocument: boolean;
    hasQuiz: boolean;
    documentReady: boolean;
  }
): Promise<UserIntent> => {
  const model = getIntentModel(env);
  const chain = INTENT_CLASSIFICATION_PROMPT.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    message,
    hasDocument: context.hasDocument.toString(),
    hasQuiz: context.hasQuiz.toString(),
    documentReady: context.documentReady.toString(),
  });
  
  return result.trim() as UserIntent;
};