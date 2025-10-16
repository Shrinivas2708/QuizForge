// services/intent.service.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import type { AppEnv } from "../types";

// --- Intent Types ---
export const USER_INTENTS = {
  QUIZ_REQUEST: 'quiz_request',
  QUIZ_START: 'quiz_start',
  CONTENT_QUESTION: 'content_question',
  NEW_DOCUMENT: 'new_document',
  PLATFORM_QUESTION: 'platform_question',
  OUT_OF_SCOPE: 'out_of_scope',
  GREETING: 'greeting',
} as const;

export type UserIntent = typeof USER_INTENTS[keyof typeof USER_INTENTS];

export interface IntentContext {
  hasDocument: boolean;
  hasQuiz: boolean;
  documentReady: boolean;
  recentMessages?: string[]; // Optional: for better context understanding
}

export interface IntentResult {
  intent: UserIntent;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
}

// --- Structured Schema for Reliable Parsing ---
const intentSchema = z.object({
  intent: z.enum([
    'quiz_request',
    'quiz_start',
    'content_question',
    'new_document',
    'platform_question',
    'out_of_scope',
    'greeting',
  ]).describe("The classified intent of the user's message"),
  confidence: z.enum(['high', 'medium', 'low']).describe("Confidence level of the classification"),
  reasoning: z.string().optional().describe("Brief explanation of why this intent was chosen"),
});

const intentParser = StructuredOutputParser.fromZodSchema(intentSchema);

// --- Model Configuration ---
const getIntentModel = (env: AppEnv["Bindings"]) => new ChatGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
  model: "gemini-2.0-flash-exp",
  temperature: 0.1,
  maxOutputTokens: 256, // Keep it concise for intent classification
});

// --- Enhanced Prompt with Examples ---
const INTENT_CLASSIFICATION_PROMPT = PromptTemplate.fromTemplate(`You are an intent classifier for an AI-powered quiz generation platform. Users can upload documents, generate quizzes, ask questions about their content, and take tests.

**Available Intents:**

1. **quiz_request**: User wants to generate a new quiz or modify quiz settings
   - Examples: "create a quiz", "make it harder", "generate 20 questions", "quiz me on this"

2. **quiz_start**: User is ready to begin taking the quiz
   - Examples: "start quiz", "let's begin", "I'm ready", "start the test"

3. **content_question**: User asks about the uploaded document's content (summaries, explanations, clarifications)
   - Examples: "what does chapter 3 say?", "explain quantum entanglement", "summarize the main points", "what is photosynthesis?"

4. **new_document**: User wants to upload or switch to a different document
   - Examples: "upload new file", "different document", "change the PDF", "start over"

5. **platform_question**: User needs help understanding how the platform works
   - Examples: "how do I upload?", "what can you do?", "how does this work?"

6. **greeting**: Simple greeting or conversational message
   - Examples: "hello", "hi there", "thanks", "goodbye"

7. **out_of_scope**: Message unrelated to the platform or document content
   - Examples: "what's the weather?", "tell me a joke", "who won the game?"

**Context:**
- Has uploaded document: {hasDocument}
- Document is ready for use: {documentReady}
- Has generated quiz: {hasQuiz}
{recentContext}

**User Message:** "{message}"

**Instructions:**
- Classify with HIGH confidence when the intent is clear and unambiguous
- Use MEDIUM confidence when there's some ambiguity but a likely intent
- Use LOW confidence when the message is very ambiguous
- Consider the context carefully (e.g., if no document is uploaded, content questions should have lower confidence)
- Provide brief reasoning for your classification

{format_instructions}`);

// --- Main Classification Function ---
export const classifyIntent = async (
  env: AppEnv["Bindings"],
  message: string,
  context: IntentContext
): Promise<IntentResult> => {
  try {
    const model = getIntentModel(env);
    const formatInstructions = intentParser.getFormatInstructions();
    
    // Build recent context string if available
    const recentContext = context.recentMessages?.length
      ? `\n- Recent conversation: ${context.recentMessages.slice(-3).join(' | ')}`
      : '';

    const chain = INTENT_CLASSIFICATION_PROMPT
      .pipe(model)
      .pipe(intentParser);

    const result = await chain.invoke({
      message: message.trim(),
      hasDocument: context.hasDocument.toString(),
      hasQuiz: context.hasQuiz.toString(),
      documentReady: context.documentReady.toString(),
      recentContext,
      format_instructions: formatInstructions,
    });

    return result as IntentResult;
  } catch (error) {
    console.error('Intent classification error:', error);
    // Fallback to basic keyword matching
    return fallbackIntentClassification(message, context);
  }
};

// --- Fallback Classification (Rule-Based) ---
const fallbackIntentClassification = (message: string, context: IntentContext): IntentResult => {
  const lowerMessage = message.toLowerCase().trim();

  // Greeting patterns
  if (/^(hi|hello|hey|good morning|good afternoon|thanks|thank you|bye|goodbye)/.test(lowerMessage)) {
    return { intent: USER_INTENTS.GREETING, confidence: 'high' };
  }

  if (/^(start|begin|let's start|ready|let's go|take quiz|take test)/.test(lowerMessage)) {
    return { intent: USER_INTENTS.QUIZ_START, confidence: 'medium' };
  }
  if (/(create|generate|make|build).*(quiz|test|questions)|(quiz|test).*(me|on this)/.test(lowerMessage)) {
    return { intent: USER_INTENTS.QUIZ_REQUEST, confidence: 'medium' };
  }

  if (/(new|different|another|upload|change).*(document|file|pdf)/.test(lowerMessage)) {
    return { intent: USER_INTENTS.NEW_DOCUMENT, confidence: 'medium' };
  }

  if (/(how do|how to|help|what can you|how does this)/.test(lowerMessage)) {
    return { intent: USER_INTENTS.PLATFORM_QUESTION, confidence: 'medium' };
  }

  if (context.hasDocument && /(what|explain|tell me|describe|summarize|how|why|when|where)/.test(lowerMessage)) {
    return { intent: USER_INTENTS.CONTENT_QUESTION, confidence: 'low' };
  }

  return { intent: USER_INTENTS.OUT_OF_SCOPE, confidence: 'low' };
};

export const isHighConfidenceIntent = (result: IntentResult): boolean => {
  return result.confidence === 'high';
};
export const getIntentDisplayName = (intent: UserIntent): string => {
  const displayNames: Record<UserIntent, string> = {
    [USER_INTENTS.QUIZ_REQUEST]: 'Quiz Generation Request',
    [USER_INTENTS.QUIZ_START]: 'Start Quiz',
    [USER_INTENTS.CONTENT_QUESTION]: 'Content Question',
    [USER_INTENTS.NEW_DOCUMENT]: 'New Document Upload',
    [USER_INTENTS.PLATFORM_QUESTION]: 'Platform Help',
    [USER_INTENTS.OUT_OF_SCOPE]: 'Out of Scope',
    [USER_INTENTS.GREETING]: 'Greeting',
  };
  return displayNames[intent] || intent;
};