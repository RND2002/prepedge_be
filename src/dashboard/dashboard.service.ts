import { User } from '../users/user.schema';
import { Onboarding } from '../onboarding/onboarding.schema';
import { InterviewSession } from '../interview/interview-session.schema';
import { format, subDays } from 'date-fns';

export const dashboardService = {
  getStats: async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const onboarding = await Onboarding.findOne({ user: userId });
    const track = onboarding?.track || 'MERN';

    // Fetch completed sessions
    const completedSessions = await InterviewSession.find({ 
      userId, 
      status: 'completed' 
    }).sort({ createdAt: 1 }); // Oldest first for chronological trend

    console.log(`[Dashboard] userId: ${userId}, completedSessions: ${completedSessions.length}`);

    let radarData: any[] = [];
    let vulnerabilities: any[] = [];
    let trendData: any[] = [];
    let currentScore = 0;
    let deltaStr = '+0% week';

    if (completedSessions.length === 0) {
      // -----------------------------------------------------
      // FALLBACK TO MOCK DATA IF NO COMPLETED INTERVIEWS YET
      // -----------------------------------------------------
      if (track === 'COLLEGE_FRESHER') {
        radarData = [
          { subject: 'Data Structures', A: 60, B: 55, fullMark: 100 },
          { subject: 'Algorithms', A: 50, B: 60, fullMark: 100 },
          { subject: 'OS Concepts', A: 70, B: 65, fullMark: 100 },
          { subject: 'DBMS', A: 65, B: 70, fullMark: 100 },
          { subject: 'Networks', A: 55, B: 50, fullMark: 100 },
        ];
        vulnerabilities = [
          { id: '1', type: 'DSA', title: 'Dynamic Programming', desc: 'Struggling with memoization logic', action: 'PRACTICE PATTERNS', icon: 'account_tree' },
        ];
      } else if (track.includes('MERN')) {
         radarData = [
          { subject: 'React', A: 85, B: 75, fullMark: 100 },
          { subject: 'Node.js', A: 70, B: 65, fullMark: 100 },
          { subject: 'MongoDB', A: 60, B: 80, fullMark: 100 },
          { subject: 'System Design', A: 75, B: 70, fullMark: 100 },
          { subject: 'JavaScript', A: 90, B: 85, fullMark: 100 },
        ];
      } else if (track === 'PYTHON') {
        radarData = [
          { subject: 'Django/Flask', A: 80, B: 70, fullMark: 100 },
          { subject: 'Data Science', A: 65, B: 60, fullMark: 100 },
          { subject: 'PostgreSQL', A: 75, B: 80, fullMark: 100 },
          { subject: 'System Design', A: 70, B: 65, fullMark: 100 },
          { subject: 'Python Basics', A: 95, B: 90, fullMark: 100 },
        ];
      } else {
        radarData = [
          { subject: 'React', A: 40, B: 50, fullMark: 100 },
          { subject: 'Node.js', A: 40, B: 50, fullMark: 100 },
          { subject: 'MongoDB', A: 40, B: 50, fullMark: 100 },
          { subject: 'System Design', A: 40, B: 50, fullMark: 100 },
          { subject: 'JavaScript', A: 40, B: 50, fullMark: 100 },
        ];
      }
      
      trendData = [
        { name: format(subDays(new Date(), 4), 'MMM d'), score: 0 },
        { name: format(subDays(new Date(), 2), 'MMM d'), score: 0 },
        { name: format(new Date(), 'MMM d'), score: 0 },
      ];
      currentScore = 0;
      deltaStr = 'No data yet';
      
      if (vulnerabilities.length === 0) {
        vulnerabilities = [
           { id: '1', type: 'GENERAL', title: 'Take an Interview', desc: 'Complete an interview to see weaknesses', action: 'START NOW', icon: 'play_arrow' },
        ];
      }
    } else {
      // -----------------------------------------------------
      // COMPUTE DYNAMIC DATA FROM COMPLETED INTERVIEWS
      // -----------------------------------------------------
      
      // 1. Trend Data (Last 7 sessions)
      const recentSessions = completedSessions.slice(-7);
      trendData = recentSessions.map(s => ({
        name: format(s.createdAt, 'MMM d'),
        score: s.results?.overallScore || 0
      }));

      // 2. Skill Score & Delta
      const latestSession = recentSessions[recentSessions.length - 1];
      const previousSession = recentSessions.length > 1 ? recentSessions[recentSessions.length - 2] : null;
      
      currentScore = latestSession.results?.overallScore || 0;
      
      if (latestSession.results?.improvementFromLast) {
        const imp = latestSession.results.improvementFromLast;
        deltaStr = `${imp >= 0 ? '+' : ''}${imp.toFixed(1)}% vs last`;
      } else if (previousSession) {
        const prevScore = previousSession.results?.overallScore || 0;
        const diff = currentScore - prevScore;
        deltaStr = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs last`;
      } else {
        deltaStr = 'First interview done';
      }

      // 3. Radar Data (Average topic scores or just take latest)
      // We will take the latest session's topicScores for simplicity and accuracy of current state
      if (latestSession.results?.topicScores) {
        const topicScoresMap = latestSession.results.topicScores as any;
        radarData = Array.from(topicScoresMap.keys()).map((topic: any) => {
          const score = topicScoresMap.get(topic) || 0;
          return {
            subject: topic,
            A: score,
            B: 70, // Benchmark
            fullMark: 100
          };
        });
      }
      
      // Fallback if topicScores is empty for some reason
      if (radarData.length === 0) {
        radarData = [
          { subject: 'General', A: currentScore, B: 70, fullMark: 100 }
        ];
      }

      // 4. Vulnerabilities
      if (latestSession.results?.studyPlan && latestSession.results.studyPlan.length > 0) {
        vulnerabilities = latestSession.results.studyPlan.slice(0, 3).map((plan: any, idx: number) => ({
          id: String(idx + 1),
          type: plan.topic.toUpperCase(),
          title: 'Improvement Needed',
          desc: plan.weakness || plan.dailyTask,
          action: 'REVIEW',
          icon: 'target' // Use a generic icon, frontend can map based on type
        }));
      } else if (latestSession.results?.weakAreas && latestSession.results.weakAreas.length > 0) {
        vulnerabilities = latestSession.results.weakAreas.slice(0, 3).map((weakArea: string, idx: number) => ({
          id: String(idx + 1),
          type: 'AREA',
          title: 'Weak Area',
          desc: weakArea,
          action: 'PRACTICE',
          icon: 'warning'
        }));
      } else {
        vulnerabilities = [
          { id: '1', type: 'GENERAL', title: 'All Good', desc: 'No critical weaknesses found in last interview', action: 'KEEP IT UP', icon: 'check_circle' },
        ];
      }
    }

    return {
      user: { name: user.name, role: user.role },
      hasCompletedInterviews: completedSessions.length > 0,
      skillScore: {
        current: currentScore,
        delta: deltaStr
      },
      radarData,
      trendData,
      vulnerabilities
    };
  }
};
