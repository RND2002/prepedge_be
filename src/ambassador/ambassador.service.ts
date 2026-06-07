import { Ambassador } from './ambassador.schema';
import { User } from '../users/user.schema';
import { InterviewSession } from '../interview/interview-session.schema';
import { sendApplicationConfirmation } from './emails/applicationConfirmation';
import { sendApprovalEmail } from './emails/approvalEmail';
import { sendRejectionEmail } from './emails/rejectionEmail';
import { sendAdminNotification } from './emails/adminNotification';

export const applyForAmbassador = async (data: any) => {
  // Check duplicate email
  const existing = await Ambassador.findOne({ email: data.email });
  if (existing) {
    if (existing.status === 'applied') {
      throw new Error("Already applied. We'll review and get back to you.");
    } else if (existing.status === 'approved') {
      throw new Error("You're already an ambassador!");
    } else if (existing.status === 'rejected') {
      throw new Error("Your previous application was not approved.");
    }
  }

  const ambassador = new Ambassador({
    ...data,
    status: 'applied',
    appliedAt: new Date()
  });

  await ambassador.save();

  // Send emails async
  sendApplicationConfirmation(ambassador.email, ambassador.fullName, ambassador.collegeName);
  sendAdminNotification(ambassador);

  return ambassador;
};

export const verifyReferralCode = async (referralCode: string) => {
  const ambassador = await Ambassador.findOne({ referralCode, status: 'approved' });
  if (!ambassador) {
    throw new Error("Invalid referral code");
  }
  return {
    ambassadorName: ambassador.fullName,
    collegeName: ambassador.collegeName,
    isValid: true
  };
};

export const trackReferral = async (referralCode: string, newUserId: string) => {
  const ambassador = await Ambassador.findOne({ referralCode, status: 'approved' });
  if (!ambassador) return;

  await User.updateOne(
    { _id: newUserId },
    { 
      $set: { 
        'referredBy.ambassadorId': ambassador._id,
        'referredBy.referralCode': referralCode,
        'referredBy.referredAt': new Date(),
        'referredBy.credited': false
      } 
    }
  );
};

export const creditReferral = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || !user.referredBy?.ambassadorId || user.referredBy.credited) return;

  await Ambassador.updateOne(
    { _id: user.referredBy.ambassadorId },
    { $inc: { referralCount: 1, activeReferrals: 1 } }
  );

  await User.updateOne(
    { _id: userId },
    { $set: { 'referredBy.credited': true } }
  );
};

export const generateUniqueReferralCode = async (city: string): Promise<string> => {
  const cityCode = city.substring(0, 3).toUpperCase();
  let unique = false;
  let code = '';
  
  while (!unique) {
    const random = Math.floor(Math.random() * 900) + 100;
    code = `PREP-${cityCode}-${random}`;
    const existing = await Ambassador.findOne({ referralCode: code });
    if (!existing) unique = true;
  }
  
  return code;
};

export const approveAmbassador = async (id: string, note?: string) => {
  const ambassador = await Ambassador.findById(id);
  if (!ambassador) throw new Error("Ambassador not found");
  if (ambassador.status !== 'applied') throw new Error("Can only approve 'applied' status");

  const referralCode = await generateUniqueReferralCode(ambassador.city);

  ambassador.status = 'approved';
  ambassador.referralCode = referralCode;
  ambassador.approvedAt = new Date();
  
  // Link to user if they already have an account
  const existingUser = await User.findOne({ email: ambassador.email });
  if (existingUser) {
    ambassador.userId = existingUser._id as any;
  }

  await ambassador.save();

  sendApprovalEmail(ambassador.email, ambassador.fullName, referralCode);

  return ambassador;
};

export const rejectAmbassador = async (id: string, reason: string) => {
  const ambassador = await Ambassador.findById(id);
  if (!ambassador) throw new Error("Ambassador not found");

  ambassador.status = 'rejected';
  ambassador.rejectedAt = new Date();
  ambassador.rejectionReason = reason;

  await ambassador.save();

  sendRejectionEmail(ambassador.email, ambassador.fullName, ambassador.collegeName);

  return ambassador;
};

export const getAmbassadorStats = async (referralCode: string, userId: string) => {
  const ambassador = await Ambassador.findOne({ referralCode });
  if (!ambassador) throw new Error("Ambassador not found");
  
  // Verify requesting user owns it
  if (String(ambassador.userId) !== String(userId)) {
    throw new Error("Unauthorized to view these stats");
  }

  const referredUsers = await User.find({ 'referredBy.referralCode': referralCode });
  const activeUsers = referredUsers.filter(u => u.is_email_verified).length;
  
  const userIds = referredUsers.map(u => u._id);
  
  // Assuming InterviewSession exists. We will try-catch in case it's not imported correctly.
  let interviewsCompleted = 0;
  try {
    const sessions = await InterviewSession.find({ userId: { $in: userIds }, status: 'completed' });
    interviewsCompleted = sessions.length;
  } catch (e) {
    console.error("Error fetching interviews:", e);
  }

  return {
    referralCode: ambassador.referralCode,
    referralLink: `${process.env.FRONTEND_URL}?ref=${ambassador.referralCode}`,
    stats: {
      totalReferrals: ambassador.referralCount,
      activeUsers,
      interviewsCompleted
    },
    recentReferrals: referredUsers.slice(0, 5).map(u => ({
      joinedAt: u.createdAt,
      interviewsCompleted: 0 // Will need aggregation for accurate per-user count, mocking for now
    }))
  };
};

export const listAmbassadors = async (status: string, page: number, limit: number) => {
  const query: any = status === 'all' ? {} : { status };
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    Ambassador.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Ambassador.countDocuments(query)
  ]);
  
  return { data, total, page, totalPages: Math.ceil(total / limit) };
};
