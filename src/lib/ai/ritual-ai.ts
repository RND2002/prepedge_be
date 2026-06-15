import { generateObject, generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { COMPANY_INTELLIGENCE_SYSTEM_PROMPT, buildCompanyIntelligenceUserPrompt, buildDailyEmailPersonalizationPrompt, RITUAL_PLANNER_SYSTEM_PROMPT, buildRitualPlannerUserPrompt, buildRitualInterviewQuestionsPrompt, buildGameDaySummaryPrompt } from './ritual-prompts';
import { searchCompanyIntel } from './scraper';
import { QuestionGenerationSchema } from './schemas';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const getModelName = () => process.env.NODE_ENV === 'local' ? 'claude-sonnet-4-6' : 'claude-3-5-sonnet-20241022';

export const CompanyProfileAiSchema = z.object({
  name: z.string(),
  tier: z.enum(['faang', 'product', 'service', 'startup', 'finance']),
  interviewRounds: z.array(z.object({
    roundName: z.string(),
    focus: z.array(z.string()),
    weight: z.number().min(0).max(100),
    tips: z.array(z.string()),
  })).min(1),
  knownTopics: z.array(z.string()).min(1),
  behavioralFocus: z.array(z.string()).min(1),
  difficultyLevel: z.enum(['low', 'medium', 'high', 'very_high']),
  averageRounds: z.number(),
  interviewDurationMinutes: z.number(),
  whatTheyReallyWantToHear: z.array(z.string()).min(1),
  commonMistakes: z.array(z.string()).min(1),
  insiderTips: z.array(z.string()).min(1),
});

export type CompanyProfileAiData = z.infer<typeof CompanyProfileAiSchema>;

/**
 * Generates the full company intelligence profile using Claude.
 */
export const generateCompanyIntelligence = async (companyName: string, role: string, track: string, experienceLevel: string, jobDescription?: string): Promise<CompanyProfileAiData> => {
  try {
    const liveContext = await searchCompanyIntel(companyName, role);

    const { object } = await generateObject({
      model: anthropic(getModelName()),
      schema: CompanyProfileAiSchema,
      system: COMPANY_INTELLIGENCE_SYSTEM_PROMPT,
      prompt: buildCompanyIntelligenceUserPrompt(companyName, role, track, experienceLevel, liveContext, jobDescription),
      temperature: 0.3, // Low temp for factual consistency
      abortSignal: AbortSignal.timeout(120000),
    });

    return object;
  } catch (error) {
    console.error(`[AI] Failed to generate company intelligence for ${companyName}:`, error);
    throw error;
  }
};

/**
 * Generates a short 1-2 line personalized message for the daily morning email.
 */
export const generateDailyPersonalization = async (companyName: string, focusTopic: string, track: string): Promise<string> => {
  try {
    const { text } = await generateText({
      model: anthropic(getModelName()),
      prompt: buildDailyEmailPersonalizationPrompt(companyName, focusTopic, track),
      temperature: 0.7,
    });

    return text.trim();
  } catch (error) {
    console.error(`[AI] Failed to generate daily personalization for ${companyName} - ${focusTopic}:`, error);
    return `Mastering ${focusTopic} is critical for standing out in your upcoming ${companyName} interviews.`; // Fallback
  }
};

export const RitualPlanAiSchema = z.object({
  days: z.array(z.object({
    type: z.enum(['full_mock', 'mini_interview', 'strength_confirmation', 'light_warmup', 'game_day']),
    focusTopic: z.string(),
    subTopics: z.array(z.string()).min(1),
    questionCount: z.number(),
    timeLimitMinutes: z.number(),
  }))
});

export type RitualPlanAiData = z.infer<typeof RitualPlanAiSchema>;

export const generateRitualPlan = async (
  companyName: string,
  companyProfile: any,
  role: string,
  track: string,
  experienceLevel: string,
  weakAreas: string[],
  numDays: number,
  jobDescription?: string
): Promise<RitualPlanAiData> => {
  try {
    const { object } = await generateObject({
      model: anthropic(getModelName()),
      schema: RitualPlanAiSchema,
      system: RITUAL_PLANNER_SYSTEM_PROMPT,
      prompt: buildRitualPlannerUserPrompt(companyName, companyProfile, role, track, experienceLevel, weakAreas, numDays, jobDescription),
      temperature: 0.4,
      abortSignal: AbortSignal.timeout(120000),
    });

    return object;
  } catch (error) {
    console.error(`[AI] Failed to generate ritual plan for ${companyName}:`, error);
    throw error;
  }
};

export const generateRitualInterviewQuestions = async (
  companyName: string,
  companyProfile: any,
  role: string,
  track: string,
  dayType: string,
  questionCount: number,
  weakAreas: string[],
  strongAreas: string[]
) => {
  try {
    const { object } = await generateObject({
      model: anthropic(getModelName()),
      schema: QuestionGenerationSchema,
      system: buildRitualInterviewQuestionsPrompt(companyName, companyProfile, role, track, dayType, questionCount, weakAreas, strongAreas),
      prompt: "Generate the interview questions for this ritual day now.",
      temperature: 0.5,
      abortSignal: AbortSignal.timeout(120000),
    });

    return object.questions;
  } catch (error) {
    console.error(`[AI] Failed to generate ritual questions for ${companyName} Day Type: ${dayType}:`, error);
    throw error;
  }
};

export const GameDaySummarySchema = z.object({
  progressCard: z.string(),
  standoutMoments: z.array(z.string()).length(3),
  sendOffMessage: z.string(),
});

export const generateGameDaySummary = async (companyName: string, pastSessions: any[]) => {
  try {
    const { object } = await generateObject({
      model: anthropic(getModelName()),
      schema: GameDaySummarySchema,
      system: buildGameDaySummaryPrompt(companyName, pastSessions),
      prompt: "Generate the game day summary now.",
      temperature: 0.4,
      abortSignal: AbortSignal.timeout(120000),
    });
    return object;
  } catch (error) {
    console.error(`[AI] Failed to generate game day summary for ${companyName}:`, error);
    throw error;
  }
};
