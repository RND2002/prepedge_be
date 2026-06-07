import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'noreply@prepedge.online';

export const sendApplicationConfirmation = async (email: string, name: string, collegeName: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `PrepEdge <${fromEmail}>`,
      to: [email],
      subject: 'We received your PrepEdge Ambassador application 🧡',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
          <h2 style="color: #F0A500; font-size: 24px; font-weight: 700; margin-bottom: 20px;">Hey ${name},</h2>
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6;">Thanks for applying to the PrepEdge Ambassador Program.</p>
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6;">We review every application personally. You'll hear from us within 24 hours.</p>
          
          <h3 style="color: #FFFFFF; font-size: 18px; margin-top: 30px;">What happens next:</h3>
          <ul style="color: #A0A0A0; line-height: 1.6; font-size: 16px;">
            <li>We review your application</li>
            <li>If approved, you get your personal referral link and Pro access</li>
            <li>You start representing PrepEdge at ${collegeName}</li>
          </ul>

          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 30px;">Talk soon,<br>Aryan<br>Founder, PrepEdge</p>
        </div>
      `,
    });

    if (error) console.error('Error sending application confirmation:', error);
  } catch (error) {
    console.error('Failed to send application confirmation:', error);
  }
};
