import { generateObject } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

import { EvaluationResponseSchema, EvaluationResponse, QuestionGenerationSchema } from './schemas';
import { buildSystemPrompt, buildUserMessage, buildQuestionGenerationSystemPrompt, AIQuestionGenConfig, AIEvaluationSessionConfig, AIBehaviorSummary } from './prompts';

export const generateQuestionsWithAI = async (config: AIQuestionGenConfig, weakAreas: string[]) => {
  const { object } = await generateObject({
    // model: google('gemini-2.5-pro'),
    model: anthropic('claude-sonnet-4-6'),
    schema: QuestionGenerationSchema,
    system: buildQuestionGenerationSystemPrompt(config, weakAreas),
    prompt: "Generate the interview questions now.",
    temperature: 0.7, // Higher temp for varied question generation

  });
  return object.questions;
};

export const evaluateSessionWithAI = async (
  answers: any[],
  sessionConfig: AIEvaluationSessionConfig,
  behaviorSummary: AIBehaviorSummary
): Promise<EvaluationResponse> => {
  const system = buildSystemPrompt(sessionConfig, behaviorSummary);
  const prompt = buildUserMessage(answers);

  const { object } = await generateObject({
    // model: google('gemini-2.5-pro'),
    model: anthropic('claude-sonnet-4-6'),
    schema: EvaluationResponseSchema,
    system,
    prompt,
    temperature: 0.2, // Low temperature for consistent grading
  });

  return object;
};
