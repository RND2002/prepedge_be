import bcrypt from 'bcryptjs';
import { sendCustomEmail } from '../lib/email';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Admin, AdminRefreshToken, AuditLog, UserModeration, IAdmin } from './admin.model';
import { User } from '../users/user.schema';
import { InterviewSession } from '../interview/interview-session.schema';
import { Onboarding } from '../onboarding/onboarding.schema';
import { Answer } from '../interview/answer.schema';

const ADMIN_ACCESS_SECRET = process.env.ADMIN_ACCESS_SECRET || 'admin_fallback_access_secret';
const ADMIN_REFRESH_SECRET = process.env.ADMIN_REFRESH_SECRET || 'admin_fallback_refresh_secret';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN_DAYS = 30;

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

// Password policy validator
export const validateAdminPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
};

export const seedDefaultAdmin = async (): Promise<void> => {
  try {
    const existingAdmin = await Admin.findOne({ email: 'testadmin@prepedge.com' });
    if (!existingAdmin) {
      const password_hash = await bcrypt.hash('Test@123', 12);
      await Admin.create({
        name: 'Default Super Admin',
        email: 'testadmin@prepedge.com',
        password_hash,
        role: 'SUPER_ADMIN',
        isActive: true
      });
      console.log('[Seed] Default Super Admin seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding default admin:', error);
  }
};

export const writeAuditLog = async (
  adminId: string,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await AuditLog.create({
      adminId,
      action,
      entity,
      entityId,
      metadata
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

const generateTokens = async (admin: any, ipAddress?: string, userAgent?: string) => {
  const payload = { sub: admin._id, email: admin.email, role: admin.role };
  const accessToken = jwt.sign(payload, ADMIN_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

  const rawRefreshToken = crypto.randomUUID();
  const hashedRefreshToken = hashToken(rawRefreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_IN_DAYS);

  await AdminRefreshToken.create({
    adminId: admin._id,
    token: hashedRefreshToken,
    expiresAt,
    ipAddress,
    userAgent
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

export const login = async (data: any, ipAddress?: string, userAgent?: string) => {
  const admin = await Admin.findOne({ email: data.email });
  if (!admin) {
    throw new Error('INVALID_CREDENTIALS');
  }

  if (!admin.isActive) {
    throw new Error('ADMIN_INACTIVE');
  }

  const isMatch = await bcrypt.compare(data.password, admin.password_hash);
  if (!isMatch) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const tokens = await generateTokens(admin, ipAddress, userAgent);
  
  admin.lastLogin = new Date();
  await admin.save();

  await writeAuditLog(admin._id.toString(), 'Admin Login', 'Admin', admin._id.toString(), { ipAddress, userAgent });

  const { password_hash: _, ...adminWithoutPassword } = admin.toObject();
  return { ...tokens, admin: adminWithoutPassword };
};

export const refresh = async (rawRefreshToken: string, ipAddress?: string, userAgent?: string) => {
  const hashedToken = hashToken(rawRefreshToken);
  const storedToken = await AdminRefreshToken.findOne({ token: hashedToken });

  if (!storedToken) {
    throw new Error('INVALID_TOKEN');
  }

  if (storedToken.isRevoked) {
    await AdminRefreshToken.updateMany({ adminId: storedToken.adminId }, { isRevoked: true });
    throw new Error('REUSE_DETECTED');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new Error('TOKEN_EXPIRED');
  }

  const admin = await Admin.findById(storedToken.adminId);
  if (!admin || !admin.isActive) {
    throw new Error('ADMIN_NOT_FOUND');
  }

  const payload = { sub: admin._id, email: admin.email, role: admin.role };
  const accessToken = jwt.sign(payload, ADMIN_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

  return { accessToken };
};

export const logout = async (rawRefreshToken: string) => {
  if (!rawRefreshToken) return;
  const hashedToken = hashToken(rawRefreshToken);
  const storedToken = await AdminRefreshToken.findOneAndUpdate(
    { token: hashedToken },
    { isRevoked: true }
  );
  if (storedToken) {
    await writeAuditLog(storedToken.adminId.toString(), 'Admin Logout', 'Admin', storedToken.adminId.toString());
  }
};

export const getDashboardData = async () => {
  const totalUsers = await User.countDocuments();
  const totalInterviews = await InterviewSession.countDocuments();
  
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const interviewsToday = await InterviewSession.countDocuments({ createdAt: { $gte: startOfToday } });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const activeUsersList = await InterviewSession.distinct('userId', { updatedAt: { $gte: sevenDaysAgo } });
  const activeUsers = activeUsersList.length;

  const adminsCount = await Admin.countDocuments();

  const completedSessionsAgg = await InterviewSession.aggregate([
    { $match: { status: 'completed', 'results.overallScore': { $exists: true } } },
    { $group: { _id: null, avgScore: { $avg: '$results.overallScore' }, count: { $sum: 1 } } }
  ]);
  
  const avgScore = completedSessionsAgg.length > 0 ? Number(completedSessionsAgg[0].avgScore.toFixed(1)) : 0;
  const completedCount = completedSessionsAgg.length > 0 ? completedSessionsAgg[0].count : 0;

  let successRate = 0;
  if (completedCount > 0) {
    const successCount = await InterviewSession.countDocuments({
      status: 'completed',
      'results.overallScore': { $gte: 7 } // Assuming score matches /10 scaling, benchmark is 7. Or if /100, 70.
    });
    // Wait, let's look at the result schema. The results score has overallScore. In dashboard.service, average is /10 scaling, let's see. In results.html we saw Number(score).toFixed(1) / 10, so score is indeed out of 10!
    // So score >= 7 (equivalent to 70% success) is the right threshold!
    successRate = Number(((successCount / completedCount) * 100).toFixed(1));
  }

  // Recent Signups (5)
  const recentSignups = await User.find({}, 'name email createdAt').sort({ createdAt: -1 }).limit(5);

  // Recent Interviews (5)
  const recentInterviewsList = await InterviewSession.find({})
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentInterviews = recentInterviewsList.map(s => ({
    id: s._id,
    user: (s.userId as any)?.name || 'Unknown User',
    email: (s.userId as any)?.email || '',
    stack: s.config?.stack || '',
    role: s.config?.targetRole || '',
    score: s.results?.overallScore || null,
    status: s.status,
    date: s.createdAt
  }));

  // Charts
  // 1. Daily activity (sessions created per day for the last 7 days)
  const dailyActivity: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    
    const start = new Date(d);
    start.setHours(0,0,0,0);
    const end = new Date(d);
    end.setHours(23,59,59,999);

    const count = await InterviewSession.countDocuments({ createdAt: { $gte: start, $lte: end } });
    dailyActivity.push({
      date: dateStr,
      interviews: count
    });
  }

  // 2. Score Distribution buckets
  const scoreDistribution = [
    { range: '0-2', count: await InterviewSession.countDocuments({ status: 'completed', 'results.overallScore': { $gte: 0, $lt: 2 } }) },
    { range: '2-4', count: await InterviewSession.countDocuments({ status: 'completed', 'results.overallScore': { $gte: 2, $lt: 4 } }) },
    { range: '4-6', count: await InterviewSession.countDocuments({ status: 'completed', 'results.overallScore': { $gte: 4, $lt: 6 } }) },
    { range: '6-8', count: await InterviewSession.countDocuments({ status: 'completed', 'results.overallScore': { $gte: 6, $lt: 8 } }) },
    { range: '8-10', count: await InterviewSession.countDocuments({ status: 'completed', 'results.overallScore': { $gte: 8, $lte: 10 } }) }
  ];

  // 3. User growth (cumulative users created over the last 30 days)
  const usersGrowth: any[] = [];
  const totalUsersBefore30Days = await User.countDocuments({ createdAt: { $lt: new Date(new Date().setDate(new Date().getDate() - 30)) } });
  let cumulativeUsers = totalUsersBefore30Days;
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    
    const start = new Date(d);
    start.setHours(0,0,0,0);
    const end = new Date(d);
    end.setHours(23,59,59,999);

    const count = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });
    cumulativeUsers += count;
    usersGrowth.push({
      date: dateStr,
      users: cumulativeUsers
    });
  }

  // 4. Interview growth (cumulative interviews over the last 30 days)
  const interviewGrowth: any[] = [];
  const totalInterviewsBefore30Days = await InterviewSession.countDocuments({ createdAt: { $lt: new Date(new Date().setDate(new Date().getDate() - 30)) } });
  let cumulativeInterviews = totalInterviewsBefore30Days;
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    
    const start = new Date(d);
    start.setHours(0,0,0,0);
    const end = new Date(d);
    end.setHours(23,59,59,999);

    const count = await InterviewSession.countDocuments({ createdAt: { $gte: start, $lte: end } });
    cumulativeInterviews += count;
    interviewGrowth.push({
      date: dateStr,
      interviews: cumulativeInterviews
    });
  }

  return {
    stats: {
      totalUsers,
      totalInterviews,
      interviewsToday,
      activeUsers,
      adminsCount,
      avgScore,
      successRate
    },
    recentSignups,
    recentInterviews,
    charts: {
      usersGrowth,
      interviewGrowth,
      dailyActivity,
      scoreDistribution
    }
  };
};

export const getUsersList = async (query: any) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, parseInt(query.limit) || 10);
  const search = query.search || '';
  const statusFilter = query.status || ''; // 'active' | 'suspended'

  const skip = (page - 1) * limit;

  // Let's build match criteria for users
  let matchCriteria: any = {};
  if (search) {
    matchCriteria.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // We can fetch suspended user IDs from UserModeration
  let suspendedUserIds: mongoose.Types.ObjectId[] = [];
  if (statusFilter || search === '') {
    const moderations = await UserModeration.find({ isSuspended: true });
    suspendedUserIds = moderations.map(m => m.userId);
  }

  if (statusFilter === 'suspended') {
    matchCriteria._id = { $in: suspendedUserIds };
  } else if (statusFilter === 'active') {
    matchCriteria._id = { $nin: suspendedUserIds };
  }

  const total = await User.countDocuments(matchCriteria);
  const users = await User.find(matchCriteria, 'name email createdAt avatar wallet')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // For each user, attach isSuspended, interview counts, and average score
  const usersWithMetrics = await Promise.all(
    users.map(async user => {
      const isSuspended = suspendedUserIds.some(id => id.toString() === user._id.toString()) || 
        (await UserModeration.findOne({ userId: user._id, isSuspended: true }).then(m => !!m));

      const interviewCount = await InterviewSession.countDocuments({ userId: user._id });

      const completedAgg = await InterviewSession.aggregate([
        { $match: { userId: user._id, status: 'completed', 'results.overallScore': { $exists: true } } },
        { $group: { _id: null, avgScore: { $avg: '$results.overallScore' } } }
      ]);
      const avgScore = completedAgg.length > 0 ? Number(completedAgg[0].avgScore.toFixed(1)) : 0;

      return {
        id: user._id,
        name: user.name || 'No Name',
        email: user.email,
        createdAt: user.createdAt,
        avatar: user.avatar,
        isSuspended,
        interviewCount,
        avgScore,
        credits: user.wallet?.credits || 0
      };
    })
  );

  return {
    users: usersWithMetrics,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getUserDetails = async (userId: string) => {
  const user = await User.findById(userId).populate('onboarding');
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const moderation = await UserModeration.findOne({ userId }).populate('suspendedBy', 'name email');

  // Interview Sessions
  const sessions = await InterviewSession.find({ userId }).sort({ createdAt: -1 });

  const completed = sessions.filter(s => s.status === 'completed');
  const totalInterviews = sessions.length;
  
  const completedAgg = await InterviewSession.aggregate([
    { $match: { userId: user._id, status: 'completed', 'results.overallScore': { $exists: true } } },
    { $group: { _id: null, avgScore: { $avg: '$results.overallScore' } } }
  ]);
  const avgScore = completedAgg.length > 0 ? Number(completedAgg[0].avgScore.toFixed(1)) : 0;

  // Let's create an activity timeline of events: User Created, Onboarded, and Interviews Taken
  const timeline: any[] = [
    { event: 'User Signed Up', date: user.createdAt }
  ];

  if (user.onboarding) {
    timeline.push({ event: 'Completed Onboarding', date: (user.onboarding as any).createdAt || user.createdAt });
  }

  sessions.forEach(s => {
    timeline.push({
      event: `Started ${s.config?.stack || ''} Interview (#${s.sessionNumber})`,
      date: s.createdAt,
      type: 'interview_start',
      status: s.status
    });
    if (s.status === 'completed' && s.timing?.completedAt) {
      timeline.push({
        event: `Completed ${s.config?.stack || ''} Interview with score ${s.results?.overallScore || 0}/10`,
        date: s.timing.completedAt,
        type: 'interview_complete',
        score: s.results?.overallScore
      });
    }
  });

  timeline.sort((a, b) => b.date.getTime() - a.date.getTime()); // Latest first

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
      google_id: user.google_id,
      is_email_verified: user.is_email_verified
    },
    onboarding: user.onboarding || null,
    moderation: moderation ? {
      isSuspended: moderation.isSuspended,
      suspendedAt: moderation.suspendedAt,
      suspendedBy: moderation.suspendedBy,
      reason: moderation.reason
    } : { isSuspended: false },
    stats: {
      totalInterviews,
      completedInterviews: completed.length,
      avgScore
    },
    interviews: sessions.map(s => ({
      id: s._id,
      stack: s.config?.stack,
      role: s.config?.targetRole,
      experience: s.config?.experienceLevel,
      status: s.status,
      score: s.results?.overallScore || null,
      date: s.createdAt
    })),
    timeline
  };
};

export const toggleUserSuspension = async (
  userId: string,
  isSuspended: boolean,
  adminId: string,
  reason?: string
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  let moderation = await UserModeration.findOne({ userId });
  if (!moderation) {
    moderation = new UserModeration({ userId });
  }

  moderation.isSuspended = isSuspended;
  if (isSuspended) {
    moderation.suspendedAt = new Date();
    moderation.suspendedBy = new mongoose.Types.ObjectId(adminId) as any;
    moderation.reason = reason || 'No reason provided';
  } else {
    moderation.suspendedAt = undefined;
    moderation.suspendedBy = undefined;
    moderation.reason = undefined;
  }

  await moderation.save();

  await writeAuditLog(
    adminId,
    isSuspended ? 'User Suspension' : 'User Activation',
    'User',
    userId,
    { reason }
  );

  return moderation;
};

export const getInterviewsList = async (query: any) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, parseInt(query.limit) || 10);
  const search = query.search || '';
  const status = query.status || '';

  const skip = (page - 1) * limit;

  let matchCriteria: any = {};
  if (status) {
    matchCriteria.status = status;
  }

  // To search by user name/email, we first query users matching search
  if (search) {
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    });
    const userIds = matchingUsers.map(u => u._id);
    
    // We search either user matched OR config fields matched
    matchCriteria.$or = [
      { userId: { $in: userIds } },
      { 'config.stack': { $regex: search, $options: 'i' } },
      { 'config.targetRole': { $regex: search, $options: 'i' } }
    ];
  }

  const total = await InterviewSession.countDocuments(matchCriteria);
  const sessions = await InterviewSession.find(matchCriteria)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    interviews: sessions.map(s => ({
      id: s._id,
      user: (s.userId as any)?.name || 'Unknown User',
      email: (s.userId as any)?.email || '',
      stack: s.config?.stack || '',
      role: s.config?.targetRole || '',
      experience: s.config?.experienceLevel || '',
      score: s.results?.overallScore || null,
      status: s.status,
      date: s.createdAt
    })),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getInterviewDetails = async (id: string) => {
  // Populate both User and Answers if schema allows.
  // Wait, does answers store in a separate collection?
  // Let's check: in prepedge_be/src/interview/answer.schema.ts there is Answer model.
  // Let's find answers for this session: `Answer.find({ sessionId })`
  const session = await InterviewSession.findById(id).populate('userId', 'name email avatar');
  if (!session) {
    throw new Error('INTERVIEW_NOT_FOUND');
  }

  // Fetch answers for this session
  let answers: any[] = [];
  try {
    answers = await Answer.find({ sessionId: session._id }).sort({ 'snapshot.sequenceNumber': 1 });
  } catch (err) {
    console.error('Failed to query answers for session:', err);
  }

  return {
    session,
    answers
  };
};

export const getAdminsList = async (adminId: string) => {
  // Return all admins
  const admins = await Admin.find({}, '-password_hash').sort({ createdAt: -1 });
  return admins;
};

export const createAdmin = async (adminId: string, data: any) => {
  if (!validateAdminPassword(data.password)) {
    throw new Error('PASSWORD_POLICY_VIOLATED');
  }

  const existing = await Admin.findOne({ email: data.email });
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }

  const password_hash = await bcrypt.hash(data.password, 12);
  const newAdmin = await Admin.create({
    name: data.name,
    email: data.email,
    password_hash,
    role: data.role || 'ADMIN',
    isActive: data.isActive !== undefined ? data.isActive : true
  });

  await writeAuditLog(adminId, 'Admin Creation', 'Admin', newAdmin._id.toString(), {
    name: newAdmin.name,
    email: newAdmin.email,
    role: newAdmin.role
  });

  const { password_hash: _, ...resAdmin } = newAdmin.toObject();
  return resAdmin;
};

export const updateAdmin = async (adminId: string, targetId: string, data: any) => {
  const admin = await Admin.findById(targetId);
  if (!admin) {
    throw new Error('ADMIN_NOT_FOUND');
  }

  if (data.name) admin.name = data.name;
  if (data.role && adminId !== targetId) {
    // Prevent changing own role
    admin.role = data.role;
  }
  if (data.isActive !== undefined && adminId !== targetId) {
    // Prevent deactivating oneself
    admin.isActive = data.isActive;
  }

  await admin.save();

  await writeAuditLog(adminId, 'Admin Update', 'Admin', targetId, {
    name: admin.name,
    role: admin.role,
    isActive: admin.isActive
  });

  const { password_hash: _, ...resAdmin } = admin.toObject();
  return resAdmin;
};

export const toggleAdminStatus = async (adminId: string, targetId: string, isActive: boolean) => {
  if (adminId === targetId) {
    throw new Error('CANNOT_DEACTIVATE_SELF');
  }

  const admin = await Admin.findById(targetId);
  if (!admin) {
    throw new Error('ADMIN_NOT_FOUND');
  }

  admin.isActive = isActive;
  await admin.save();

  await writeAuditLog(
    adminId,
    isActive ? 'Admin Activation' : 'Admin Deactivation',
    'Admin',
    targetId
  );

  return { id: admin._id, isActive: admin.isActive };
};

export const resetAdminPassword = async (adminId: string, targetId: string, data: any) => {
  if (!validateAdminPassword(data.password)) {
    throw new Error('PASSWORD_POLICY_VIOLATED');
  }

  const admin = await Admin.findById(targetId);
  if (!admin) {
    throw new Error('ADMIN_NOT_FOUND');
  }

  const password_hash = await bcrypt.hash(data.password, 12);
  admin.password_hash = password_hash;
  await admin.save();

  // Revoke all current tokens for this admin
  await AdminRefreshToken.updateMany({ adminId: targetId }, { isRevoked: true });

  await writeAuditLog(adminId, 'Admin Password Reset', 'Admin', targetId);

  return { message: 'Password reset successfully' };
};

export const sendBulkEmail = async (fromEmail: string, subject: string, bodyHtml: string, userIds: string[]) => {
  if (!userIds || userIds.length === 0) {
    throw new Error('NO_USERS_PROVIDED');
  }

  const users = await User.find({ _id: { $in: userIds } }, 'email');
  const emails = users.map(u => u.email).filter(e => !!e);

  if (emails.length === 0) {
    throw new Error('NO_VALID_EMAILS_FOUND');
  }

  // Send individually to protect privacy
  const promises = emails.map(email => sendCustomEmail(fromEmail, [email], subject, bodyHtml));
  const results = await Promise.all(promises);

  const successful = results.filter(r => r.success).length;

  return { success: true, count: successful, total: emails.length };
};
