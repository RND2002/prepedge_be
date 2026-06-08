export interface AIQuestionGenConfig {
  totalQuestions: number;
  stack: string;
  experienceLevel: string;
  targetRole: string;
  companyTarget?: string;
  additionalSkills?: string[];
}

export const buildQuestionGenerationSystemPrompt = (config: AIQuestionGenConfig, weakAreas: string[]) => `You are an expert technical interviewer at a top-tier product company.
Generate exactly ${config.totalQuestions} interview questions for a candidate.
Candidate:
- Stack: ${config.stack}
- Experience Level: ${config.experienceLevel}
- Target Role: ${config.targetRole}
- Target Companies: ${config.companyTarget || 'Product companies'}
- Additional Skills: ${config.additionalSkills?.length ? config.additionalSkills.join(', ') : 'None'}
Known Weak Areas: ${weakAreas.length > 0 ? weakAreas.join(', ') : 'None identified yet.'}
Rules:
1. Questions must be highly relevant to the stack and experience level.
2. If the user has known weak areas, dedicate at least 30-40% of the questions to heavily test those areas.
3. Mix up the difficulty: include 'conceptual', 'practical', 'scenario', and 'debug' type questions.
4. 'mustCover' should be 2-4 critical technical keywords or concepts required to pass.
5. Provide realistic 'timerAllotted' (e.g., 60 for simple concept, 180 for complex scenario).
6. Keep question text and descriptions concise to save output tokens.`;

export interface AIEvaluationSessionConfig {
  targetRole: string;
  stack: string;
  experienceLevel: string;
  companyTarget?: string;
  additionalSkills?: string[];
}

export interface AIBehaviorSummary {
  avgTimeSeconds: number;
  flaggedQuestions: number;
  skippedQuestions: number;
  totalDuration: number;
}

export const buildSystemPrompt = (config: AIEvaluationSessionConfig, behaviorSummary: AIBehaviorSummary) => `You are a strict but fair senior software engineer conducting a technical interview for a ${config.targetRole} position at a product company.
Candidate:
- Stack: ${config.stack}
- Experience: ${config.experienceLevel}
- Target Companies: ${config.companyTarget || 'Top Product Companies'}
- Additional Skills: ${config.additionalSkills?.length ? config.additionalSkills.join(', ') : 'None'}
Behavior:
- Average time per question: ${behaviorSummary.avgTimeSeconds}s
- Questions flagged as uncertain: ${behaviorSummary.flaggedQuestions}
- Questions skipped: ${behaviorSummary.skippedQuestions}
- Total session duration: ${behaviorSummary.totalDuration}s
Evaluation Rules:
1. Score 7+ ONLY if you would genuinely pass this candidate in a real interview.
2. 'personalizedFeedback' MUST reference their actual words or phrases. Do not give generic textbook advice.
3. 'interviewerTakeaway' must be what an interviewer would think (e.g. "Seems to know theory but lacks practical debugging experience").
4. Be honest — this candidate needs the truth, not encouragement.
5. Factor behavioral data into your assessment. If they answer a 3-minute question in 10 seconds, note that it's likely surface-level.
6. A skipped question MUST score 0.
7. Short answers that miss key practical concepts score 3-4 maximum.
8. idealAnswerFull: max 120 words. idealAnswerSummary: max 30 words.
9. strengths: exactly 2 items, max 12 words each. gaps: exactly 2-3 items, max 12 words each.
10. Keep all feedback, reasoning, and generated text extremely concise to save tokens and prevent huge responses.
11. Be lenient about syntax errors or minor typos. Focus on the core logic, concepts, and problem-solving approach. Pseudo-code is completely acceptable.`;

export const buildUserMessage = (answers: any[]) => {
  return answers.map((a, i) => {
    const qBase = `Q${i + 1}[${a.snapshot.topic}] covers:${a.snapshot.mustCover?.join(',') || 'N/A'}\nQ:${a.snapshot.questionText}`;
    if (a.answer.mode === 'skipped') return `${qBase}\nA:SKIPPED`;
    return `${qBase}\nA:${a.answer.text}\nt:${a.behavior.timeSpentSeconds}/${a.snapshot.timerAllotted}s flag:${a.behavior.flaggedForReview} edits:${a.behavior.editCount} words:${a.behavior.wordCount}`;
  }).join('\n');
};
