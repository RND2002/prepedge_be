import { formatDistanceToNow } from 'date-fns';

export interface HumanContext {
  humanMessage: string;
  questionsAnswered: number;
  totalQuestions: number;
  topicWaitingFor: string | null;
  estimatedMinutesLeft: number;
  startedTimeAgo: string;
  status: string;
}

export const buildHumanContext = (session: any, answers: any[]): HumanContext => {
  const totalQuestions = session.config.totalQuestions || session.questions.length;
  
  // Calculate answered questions (Deduplicate to handle old corrupted data)
  const uniqueAnswers = Array.from(new Map(answers.map(a => [a.snapshot.sequenceNumber, a])).values());
  const answeredCount = uniqueAnswers.filter((a: any) => !a.behavior.skipped && a.answer.text.trim().length > 0).length;
  
  // Determine lowest sequence number unanswered
  const answeredSequences = new Set(answers.map(a => a.snapshot.sequenceNumber));
  let resumeSequence = 1;
  for (let i = 1; i <= totalQuestions; i++) {
    if (!answeredSequences.has(i)) {
      resumeSequence = i;
      break;
    }
  }

  // Get the question they are waiting for
  const nextQuestion = session.questions.find((q: any) => q.sequenceNumber === resumeSequence);
  const topicWaitingFor = nextQuestion ? nextQuestion.topic : null;

  // Calculate estimated minutes left
  const avgTimer = session.questions.reduce((acc: number, q: any) => acc + q.timerAllotted, 0) / session.questions.length;
  const remainingQuestions = totalQuestions - uniqueAnswers.length;
  const estimatedMinutesLeft = Math.ceil((remainingQuestions * avgTimer) / 60);

  // Time ago
  const startedTimeAgo = session.timing?.startedAt
    ? formatDistanceToNow(new Date(session.timing.startedAt), { addSuffix: true })
    : 'just now';

  // Human Message
  let humanMessage = `Question ${resumeSequence} is waiting for you`;
  if (answers.length > 0 && resumeSequence > 1) {
    humanMessage = `Pick up where you left off — Question ${resumeSequence} is ready`;
  } else if (session.status === 'questions_generated') {
    humanMessage = `Your interview is ready to begin`;
  }

  if (session.status === 'completed') {
    humanMessage = 'Interview completed';
  } else if (session.status === 'abandoned') {
    humanMessage = 'Interview abandoned';
  }

  return {
    humanMessage,
    questionsAnswered: answeredCount,
    totalQuestions,
    topicWaitingFor,
    estimatedMinutesLeft,
    startedTimeAgo,
    status: session.status,
  };
};
