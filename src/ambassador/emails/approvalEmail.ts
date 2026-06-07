import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'noreply@prepedge.online';

export const sendApprovalEmail = async (email: string, name: string, referralCode: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `PrepEdge <${fromEmail}>`,
      to: [email],
      subject: "You're a PrepEdge Ambassador! 🎉",
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
          <h2 style="color: #F0A500; font-size: 24px; font-weight: 700; margin-bottom: 20px;">Hey ${name},</h2>
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6;">Welcome to the PrepEdge Ambassador Program!</p>
          
          <h3 style="color: #FFFFFF; font-size: 18px; margin-top: 30px;">Your referral link:</h3>
          <div style="background-color: #1A1A1A; border: 1px solid #333333; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <a href="${process.env.FRONTEND_URL}?ref=${referralCode}" style="color: #2DD4BF; font-weight: bold; text-decoration: none; word-break: break-all;">
              ${process.env.FRONTEND_URL}?ref=${referralCode}
            </a>
          </div>

          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6;">Share this link with your college batch. Every signup through your link is tracked.</p>
          
          <h3 style="color: #FFFFFF; font-size: 18px; margin-top: 30px;">What to do now:</h3>
          <ul style="color: #A0A0A0; line-height: 1.6; font-size: 16px;">
            <li>Try PrepEdge yourself first</li>
            <li>Share your referral link in placement groups</li>
            <li>Reply to this email anytime you need help</li>
          </ul>

          <p style="font-size: 16px; color: #F0A500; font-weight: 600; margin-top: 20px;">Your Pro access is now active.</p>

          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 30px;">Let's get your college placement-ready.<br><br>Aryan<br>Founder, PrepEdge</p>
        </div>
      `,
    });

    if (error) console.error('Error sending approval email:', error);
  } catch (error) {
    console.error('Failed to send approval email:', error);
  }
};
