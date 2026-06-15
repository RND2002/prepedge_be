import { generateObject } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';



const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const getModelName = () => process.env.NODE_ENV === 'local' ? 'claude-sonnet-4-6' : 'claude-sonnet-4-6';
import { EvaluationResponseSchema, EvaluationResponse, QuestionGenerationSchema } from './schemas';
import { buildSystemPrompt, buildUserMessage, buildQuestionGenerationSystemPrompt, AIQuestionGenConfig, AIEvaluationSessionConfig, AIBehaviorSummary } from './prompts';

export const generateQuestionsWithAI = async (config: AIQuestionGenConfig, weakAreas: string[]) => {
  const { object } = await generateObject({
    // model: google('gemini-2.5-pro'),
    model: anthropic(getModelName()),
    schema: QuestionGenerationSchema,
    system: buildQuestionGenerationSystemPrompt(config, weakAreas),
    prompt: "Generate the interview questions now.",
    temperature: 0.7, // Higher temp for varied question generation
    abortSignal: AbortSignal.timeout(120000),
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
    model: anthropic(getModelName()),
    schema: EvaluationResponseSchema,
    system,
    prompt,
    temperature: 0.2, // Low temperature for consistent grading
    abortSignal: AbortSignal.timeout(120000),
  });

  return object;
};
