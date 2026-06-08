import mongoose from 'mongoose';

export interface AuthUserPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface OnboardingData {
  displayName?: string;
  track?: 'COLLEGE_FRESHER' | 'MERN' | 'MEAN' | 'REACT' | 'PYTHON' | 'GOLANG' | 'JAVA' | 'MANUAL_TESTING' | 'AUTOMATION_TESTING' | 'DEVOPS' | 'DATA_ANALYST' | 'DATA_ENGINEER' | 'REACT_NATIVE' | 'FLUTTER' | 'SPRING_BOOT' | 'DJANGO' | 'FASTAPI' | 'SQL_FUNDAMENTALS' | 'CYBER_SECURITY';
  experienceLevel?: 'fresher' | 'junior' | 'mid' | 'senior';
  experienceYears?: number;
  targetRole?: 'frontend' | 'backend' | 'fullstack' | 'sde1' | 'sde2' | 'qa_engineer' | 'automation_engineer' | 'devops_engineer' | 'data_analyst' | 'data_engineer' | 'mobile_developer' | 'sde3' | 'tech_lead' | 'security_engineer' | 'pentester' | 'soc_analyst';
  targetCompanies?: ('Razorpay' | 'Zepto' | 'Groww' | 'CRED' | 'PhonePe' | 'Swiggy' | 'Zomato' | 'Meesho' | 'TCS' | 'Infosys' | 'Wipro' | 'Accenture' | 'Google' | 'Microsoft' | 'Amazon' | 'Flipkart' | 'Paytm' | 'Ola' | 'Dunzo' | 'Uber' | 'JP Morgan' | 'Goldman Sachs' | 'DE Shaw' | 'Startup' | 'Other')[];
  additionalSkills?: ('PostgreSQL' | 'MySQL' | 'AWS' | 'GCP' | 'Docker' | 'Kubernetes' | 'Redis' | 'GraphQL' | 'Kafka' | 'MongoDB' | 'Firebase' | 'Selenium' | 'Cypress' | 'Jest' | 'Postman' | 'Jenkins' | 'GitHub Actions' | 'Terraform' | 'Python' | 'TypeScript' | 'System Design' | 'Burp Suite' | 'Wireshark' | 'Metasploit' | 'Nmap' | 'Linux')[];
  interviewTimeline?: 'less_than_2_weeks' | '2_to_4_weeks' | '1_to_3_months' | 'just_exploring';
  weeklyGoal?: '1-2' | '3-4' | 'daily';
  currentStep: number;
  isComplete: boolean;
  completedAt?: Date | null;
}
