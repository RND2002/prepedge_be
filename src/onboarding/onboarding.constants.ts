export const ONBOARDING_TRACKS = [
  'COLLEGE_FRESHER',
  'MERN',
  'MEAN',
  'REACT',
  'PYTHON',
  'GOLANG',
  'JAVA',
  'MANUAL_TESTING',
  'AUTOMATION_TESTING',
  'DEVOPS',
  'DATA_ANALYST',
  'DATA_ENGINEER',
  'REACT_NATIVE',
  'FLUTTER',
  'SPRING_BOOT',
  'DJANGO',
  'FASTAPI',
  'SQL_FUNDAMENTALS',
  'CYBER_SECURITY'
];

export const ONBOARDING_ROLES = [
  'frontend',
  'backend',
  'fullstack',
  'sde1',
  'sde2',
  'qa_engineer',
  'automation_engineer',
  'devops_engineer',
  'data_analyst',
  'data_engineer',
  'mobile_developer',
  'sde3',
  'tech_lead',
  'security_engineer',
  'pentester',
  'soc_analyst'
];

export const ONBOARDING_COMPANIES = [
  'Razorpay', 'Zepto', 'Groww', 'CRED',
  'PhonePe', 'Swiggy', 'Zomato', 'Meesho',
  'TCS', 'Infosys', 'Wipro', 'Accenture',
  'Google', 'Microsoft', 'Amazon', 'Flipkart',
  'Paytm', 'Ola', 'Dunzo', 'Uber',
  'JP Morgan', 'Goldman Sachs', 'DE Shaw',
  'Startup', 'Other'
];

export const ONBOARDING_SKILLS = [
  'PostgreSQL', 'MySQL', 'AWS', 'GCP',
  'Docker', 'Kubernetes', 'Redis',
  'GraphQL', 'Kafka',
  'MongoDB', 'Firebase', 'Selenium',
  'Cypress', 'Jest', 'Postman',
  'Jenkins', 'GitHub Actions', 'Terraform',
  'Python', 'TypeScript', 'System Design',
  'Burp Suite', 'Wireshark', 'Metasploit', 'Nmap', 'Linux'
];

export const INTERVIEW_TIMELINES = [
  'less_than_2_weeks',
  '2_to_4_weeks',
  '1_to_3_months',
  'just_exploring'
];

export const TRACK_CONFIG = {
  MANUAL_TESTING: {
    label: 'Manual Testing',
    targetRoles: ['qa_engineer'],
    relevantSkills: ['Postman', 'MySQL', 'PostgreSQL', 'Selenium'],
    targetCompanies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Startup', 'Other'],
    interviewFocus: ['test_cases', 'bug_reporting', 'sdlc', 'agile', 'api_testing'],
    weeklyGoalDefault: '1-2'
  },
  AUTOMATION_TESTING: {
    label: 'Automation Testing',
    targetRoles: ['qa_engineer', 'automation_engineer'],
    relevantSkills: ['Selenium', 'Cypress', 'Jest', 'Postman', 'Jenkins', 'GitHub Actions'],
    targetCompanies: ['TCS', 'Infosys', 'Wipro', 'Razorpay', 'Groww', 'Startup', 'Other'],
    interviewFocus: ['selenium', 'cypress', 'framework_design', 'ci_cd', 'api_automation'],
    weeklyGoalDefault: '1-2'
  },
  MERN: {
    label: 'MERN Stack',
    targetRoles: ['frontend', 'backend', 'fullstack', 'sde1', 'sde2', 'tech_lead'],
    relevantSkills: ['MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes', 'Kafka', 'TypeScript', 'GraphQL'],
    targetCompanies: ['Razorpay', 'CRED', 'PhonePe', 'Zepto', 'Groww', 'Meesho', 'Zomato', 'Swiggy', 'Google', 'Microsoft', 'Startup', 'Other'],
    interviewFocus: ['react', 'node', 'mongodb', 'express', 'system_design', 'dsa', 'microservices'],
    weeklyGoalDefault: '3-4'
  },
  MEAN: {
    label: 'MEAN Stack',
    targetRoles: ['frontend', 'backend', 'fullstack', 'sde1', 'sde2', 'tech_lead'],
    relevantSkills: ['MongoDB', 'AWS', 'Docker', 'Redis', 'TypeScript', 'Kubernetes'],
    targetCompanies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Startup', 'Other'],
    interviewFocus: ['angular', 'node', 'mongodb', 'typescript', 'system_design'],
    weeklyGoalDefault: '1-2'
  },
  REACT: {
    label: 'React Frontend',
    targetRoles: ['frontend', 'sde1', 'sde2', 'tech_lead'],
    relevantSkills: ['TypeScript', 'GraphQL', 'Jest', 'Cypress', 'Docker', 'AWS'],
    targetCompanies: ['Razorpay', 'CRED', 'PhonePe', 'Zepto', 'Groww', 'Meesho', 'Zomato', 'Swiggy', 'Startup', 'Other'],
    interviewFocus: ['react', 'javascript', 'typescript', 'frontend_system_design', 'dsa'],
    weeklyGoalDefault: '3-4'
  },
  JAVA: {
    label: 'Java / Spring Boot',
    targetRoles: ['backend', 'sde1', 'sde2', 'sde3'],
    relevantSkills: ['MySQL', 'PostgreSQL', 'AWS', 'Docker', 'Kafka', 'Redis'],
    targetCompanies: ['Amazon', 'Microsoft', 'JP Morgan', 'Goldman Sachs', 'DE Shaw', 'Razorpay', 'PhonePe'],
    interviewFocus: ['core_java', 'spring_boot', 'dsa', 'system_design', 'multithreading', 'hibernate'],
    weeklyGoalDefault: 'daily'
  },
  PYTHON: {
    label: 'Python',
    targetRoles: ['backend', 'data_engineer', 'sde1', 'sde2'],
    relevantSkills: ['PostgreSQL', 'MySQL', 'AWS', 'Docker', 'Redis', 'Kafka'],
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Groww', 'Startup', 'Other'],
    interviewFocus: ['python_fundamentals', 'django', 'fastapi', 'dsa', 'system_design'],
    weeklyGoalDefault: '3-4'
  },
  GOLANG: {
    label: 'Golang',
    targetRoles: ['backend', 'sde2', 'sde3'],
    relevantSkills: ['PostgreSQL', 'Docker', 'Kubernetes', 'Kafka', 'Redis', 'AWS'],
    targetCompanies: ['Razorpay', 'CRED', 'Zepto', 'Google', 'Startup', 'Other'],
    interviewFocus: ['go_fundamentals', 'concurrency', 'microservices', 'system_design', 'dsa'],
    weeklyGoalDefault: '3-4'
  },
  DEVOPS: {
    label: 'DevOps',
    targetRoles: ['devops_engineer'],
    relevantSkills: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Jenkins', 'GitHub Actions', 'Terraform'],
    targetCompanies: ['Amazon', 'Microsoft', 'Google', 'Razorpay', 'PhonePe', 'Startup', 'Other'],
    interviewFocus: ['ci_cd', 'docker', 'kubernetes', 'cloud', 'monitoring', 'scripting'],
    weeklyGoalDefault: '1-2'
  },
  DATA_ANALYST: {
    label: 'Data Analyst',
    targetRoles: ['data_analyst'],
    relevantSkills: ['MySQL', 'PostgreSQL', 'Python', 'AWS'],
    targetCompanies: ['Flipkart', 'Amazon', 'Swiggy', 'Zomato', 'Meesho', 'JP Morgan', 'Goldman Sachs'],
    interviewFocus: ['sql', 'excel', 'python_basics', 'statistics', 'data_visualization'],
    weeklyGoalDefault: '1-2'
  },
  DATA_ENGINEER: {
    label: 'Data Engineer',
    targetRoles: ['data_engineer'],
    relevantSkills: ['PostgreSQL', 'MySQL', 'AWS', 'GCP', 'Kafka', 'Docker', 'Python'],
    targetCompanies: ['Amazon', 'Flipkart', 'Google', 'JP Morgan', 'Goldman Sachs', 'Startup'],
    interviewFocus: ['sql', 'python', 'spark', 'kafka', 'data_pipelines', 'cloud'],
    weeklyGoalDefault: '3-4'
  },
  COLLEGE_FRESHER: {
    label: 'College Fresher',
    targetRoles: ['sde1', 'frontend', 'backend', 'fullstack'],
    relevantSkills: ['MySQL', 'MongoDB', 'AWS', 'Docker', 'TypeScript'],
    targetCompanies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Startup', 'Other'],
    interviewFocus: ['dsa_basics', 'oops', 'dbms', 'os', 'cn', 'project_based'],
    weeklyGoalDefault: '3-4'
  },
  REACT_NATIVE: {
    label: 'React Native',
    targetRoles: ['mobile_developer', 'frontend'],
    relevantSkills: ['TypeScript', 'Firebase', 'AWS', 'Redux'],
    targetCompanies: ['Zepto', 'Swiggy', 'Zomato', 'Meesho', 'Startup', 'Other'],
    interviewFocus: ['react_native_core', 'navigation', 'state_management', 'performance', 'native_modules'],
    weeklyGoalDefault: '1-2'
  },
  FLUTTER: {
    label: 'Flutter',
    targetRoles: ['mobile_developer'],
    relevantSkills: ['Firebase', 'AWS', 'MySQL'],
    targetCompanies: ['Startup', 'Other', 'Zepto', 'Swiggy'],
    interviewFocus: ['dart', 'flutter_widgets', 'state_management', 'firebase', 'performance'],
    weeklyGoalDefault: '1-2'
  },
  CYBER_SECURITY: {
    label: 'Cyber Security',
    targetRoles: ['security_engineer', 'pentester', 'soc_analyst'],
    relevantSkills: ['Burp Suite', 'Wireshark', 'Metasploit', 'Nmap', 'Linux', 'Python'],
    targetCompanies: ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Startup', 'Other'],
    interviewFocus: ['networking', 'cryptography', 'owasp', 'penetration_testing', 'incident_response'],
    weeklyGoalDefault: '1-2'
  }
};
