export interface ActivationEmailProps {
  firstName: string;
  totalDays: number;
  company: string;
  role: string;
  prepDays: number;
  companyFocusDay: number;
  warmupDay: number;
  interviewDate: string; // Formatted date string
}

export interface DailyMorningEmailProps {
  firstName: string;
  dayNumber: number;
  totalDays: number;
  focusTopic: string;
  subTopics: string[];
  estimatedMinutes: number;
  company: string;
  daysLeft: number;
  whyItMattersText: string; // The 1-2 lines personalized from AI/track
}

export interface EveningNudgeEmailProps {
  firstName: string;
  dayNumber: number;
}

export interface CompanyFocusEmailProps {
  firstName: string;
  company: string;
  companyTier: string;
  round1: string;
  round1Focus: string;
  round2: string;
  round2Focus: string;
  whatTheyReallyWantToHear: string;
  commonMistakes: string;
}

export interface DayBeforeEmailProps {
  firstName: string;
  company: string;
  daysCompleted: number;
}

export interface GameDayEmailProps {
  firstName: string;
  company: string;
}

export interface DebriefRequestEmailProps {
  firstName: string;
  company: string;
}
