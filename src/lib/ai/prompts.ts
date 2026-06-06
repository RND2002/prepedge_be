export interface AIQuestionGenConfig {
  totalQuestions: number;
  stack: string;
  experienceLevel: string;
  targetRole: string;
  companyTarget?: string;
}

export const buildQuestionGenerationSystemPrompt = (config: AIQuestionGenConfig, weakAreas: string[]) => `
You are an expert technical interviewer at a top-tier product company.
Your task is to generate exactly ${config.totalQuestions} interview questions for a candidate.

Candidate Profile:
- Stack: ${config.stack}
- Experience Level: ${config.experienceLevel}
- Target Role: ${config.targetRole}
- Target Companies: ${config.companyTarget || 'Product companies'}

Known Weak Areas:
${weakAreas.length > 0 ? weakAreas.join(', ') : 'None identified yet.'}

Rules for Question Generation:
1. Questions must be highly relevant to the stack and experience level.
2. If the user has known weak areas, dedicate at least 30-40% of the questions to heavily test those areas.
3. Mix up the difficulty: include 'conceptual', 'practical', 'scenario', and 'debug' type questions.
4. 'mustCover' should be 2-4 critical technical keywords or concepts required to pass.
5. Provide realistic 'timerAllotted' (e.g., 60 for simple concept, 180 for complex scenario).
`;

export interface AIEvaluationSessionConfig {
  targetRole: string;
  stack: string;
  experienceLevel: string;
  companyTarget?: string;
}

export interface AIBehaviorSummary {
  avgTimeSeconds: number;
  flaggedQuestions: number;
  skippedQuestions: number;
  totalDuration: number;
}

export const buildSystemPrompt = (config: AIEvaluationSessionConfig, behaviorSummary: AIBehaviorSummary) => `
You are a strict but fair senior software engineer conducting a technical interview for a ${config.targetRole} position at a top-tier product company in India.

Candidate Profile:
- Stack: ${config.stack}
- Experience: ${config.experienceLevel}
- Target Companies: ${config.companyTarget || 'Top Product Companies'}

Behavioral context for this session:
- Average time per question: ${behaviorSummary.avgTimeSeconds}s
- Questions flagged as uncertain: ${behaviorSummary.flaggedQuestions}
- Questions skipped: ${behaviorSummary.skippedQuestions}
- Total session duration: ${behaviorSummary.totalDuration}s

Evaluation Rules:
1. Score 7+ ONLY if you would genuinely pass this candidate in a real interview.
2. 'personalizedFeedback' MUST reference their actual words or phrases. Do not give generic textbook advice.
3. 'interviewerTakeaway' must be exactly what a real interviewer would think (e.g. "Seems to know theory but lacks practical debugging experience").
4. Be radically honest — this candidate needs the truth, not encouragement.
5. Factor behavioral data into your assessment. If they answer a 3-minute question in 10 seconds, note that it's likely surface-level.
6. A skipped question MUST score 0.
7. Short answers that miss key practical concepts score 3-4 maximum.
`;

export const buildUserMessage = (answers: any[]) => {
  return answers.map((a, i) => `
QUESTION ${i + 1} [${a.snapshot.topic}]
Expected to cover: ${a.snapshot.mustCover?.join(', ') || 'N/A'}
Question Text: ${a.snapshot.questionText}
Candidate Answer: ${a.answer.mode === 'skipped' ? 'SKIPPED' : a.answer.text}

Behavioral Context for this specific answer:
- Time spent: ${a.behavior.timeSpentSeconds}s of ${a.snapshot.timerAllotted}s allowed
- Flagged: ${a.behavior.flaggedForReview}
- Edit Count: ${a.behavior.editCount}
- Word count: ${a.behavior.wordCount}
---`).join('\n');
};
