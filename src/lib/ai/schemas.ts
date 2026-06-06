import { z } from 'zod';

export const QuestionGenerationSchema = z.object({
  questions: z.array(z.object({
    text: z.string().describe("The actual interview question"),
    topic: z.string().describe("The high-level topic, e.g., React Hooks, Node.js Event Loop"),
    subTopic: z.string().describe("The specific sub-topic, e.g., useEffect cleanup"),
    difficulty: z.enum(['conceptual', 'practical', 'scenario', 'debug', 'tradeoff']),
    timerAllotted: z.number().describe("Time in seconds to answer. Between 60 and 300 depending on complexity."),
    mustCover: z.array(z.string()).describe("Non-negotiable concepts that must be mentioned in a passing answer"),
    idealAnswerFull: z.string().describe("What a perfect, deep answer looks like"),
    interviewerPerspective: z.string().describe("Why an interviewer asks this question and what they look for")
  }))
});

export const EvaluationResponseSchema = z.object({
  answers: z.array(z.object({
    sequenceNumber: z.number(),
    score: z.number().min(0).max(10).describe("Score from 0 to 10 for the given answer. Skipped answers score 0."),
    dimensions: z.object({
      correctness: z.number().min(0).max(10),
      completeness: z.number().min(0).max(10),
      clarity: z.number().min(0).max(10),
      depth: z.number().min(0).max(10),
      practicality: z.number().min(0).max(10)
    }),
    strengths: z.array(z.string()).describe("Specific points they got right"),
    gaps: z.array(z.string()).describe("What was missing or incorrect"),
    personalizedFeedback: z.string().describe("Direct feedback referencing their actual words, NOT generic advice"),
    idealAnswerSummary: z.string().describe("Short summary of what a good answer covers"),
    idealAnswerFull: z.string().describe("Complete model answer"),
    interviewerTakeaway: z.string().describe("Honest thought of a real interviewer"),
    nextStepForThisQuestion: z.string().describe("What exactly to study next based on this specific answer"),
    depthRating: z.enum(['surface', 'adequate', 'deep', 'expert'])
  })),
  session: z.object({
    overallScore: z.number().min(0).max(10).describe("Weighted average score of the session"),
    topicScores: z.record(z.string(), z.number()).describe("Score out of 10 for each topic tested"),
    weakAreas: z.array(z.string()).describe("Topics scoring below 6"),
    strongAreas: z.array(z.string()).describe("Topics scoring above 7"),
    verdict: z.string().describe("E.g., GOOD - ALMOST READY or NEEDS PRACTICE"),
    readinessLevel: z.string().describe("E.g., SDE-1 Ready, Not Ready"),
    aiCoachSummary: z.string().describe("3-4 sentence honest assessment addressing their deepest weaknesses and strengths"),
    studyPlan: z.array(z.object({
      topic: z.string(),
      currentScore: z.number(),
      targetScore: z.number(),
      weakness: z.string(),
      resources: z.array(z.string()),
      dailyTask: z.string(),
      retestInDays: z.number()
    }))
  })
});

export type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>;
