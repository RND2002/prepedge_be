import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

// Load .env relative to this script
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'noreply@prepedge.online';

const sendWelcomeEmail = async (email: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `PrepEdge <${fromEmail}>`,
      to: [email],
      subject: 'Welcome to the PrepEdge Community! 🙌',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
          <h2 style="color: #F0A500; font-size: 24px; font-weight: 700;">Hi there!</h2>
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.5;">We're so glad you're here. 🙌</p>
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.5;">Welcome to the PrepEdge newsletter — you've just joined a community of go-getters who are serious about leveling up their prep game.</p>
          
          <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px; font-weight: 600;">Here's what you can expect from us:</p>
          <ul style="font-size: 16px; color: #A0A0A0; line-height: 1.6; padding-left: 20px;">
            <li style="margin-bottom: 8px;">✅ Actionable tips & strategies to help you prepare smarter</li>
            <li style="margin-bottom: 8px;">✅ Curated resources, updates, and insights — straight to your inbox</li>
            <li>✅ Early access to new features and exclusive content</li>
          </ul>

          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.5; margin-top: 24px;">We promise to keep things valuable, fun, and never spammy.</p>
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.5;">Stay tuned — great stuff is coming your way soon!</p>
          
          <div style="margin-top: 40px;">
            <p style="font-size: 16px; color: #F0A500; font-weight: 600; margin-bottom: 5px;">Cheers,</p>
            <p style="font-size: 16px; color: #E0E0E0; margin-top: 0;">The PrepEdge Team</p>
          </div>
          
          <p style="font-size: 14px; color: #666666; margin-top: 40px; border-top: 1px solid #1A1A1A; padding-top: 20px;">
            P.S. Follow us on <a href="https://www.linkedin.com/company/prepedge230/" style="color: #F0A500; text-decoration: none;">LinkedIn</a> to stay connected!
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
    } else {
      console.log('Welcome email sent successfully:', data);
    }
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};

// If run directly via command line
if (require.main === module) {
  const targetEmail = process.argv[2] || 'review@prepedge.online';
  console.log(`Sending welcome email to ${targetEmail}...`);
  sendWelcomeEmail(targetEmail);
}

export { sendWelcomeEmail };
