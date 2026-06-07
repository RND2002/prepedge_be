import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'noreply@prepedge.online';

export const sendRejectionEmail = async (email: string, name: string, collegeName: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `PrepEdge <${fromEmail}>`,
      to: [email],
      subject: 'PrepEdge Ambassador Application Update',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
          <h2 style="color: #E0E0E0; font-size: 24px; font-weight: 700; margin-bottom: 20px;">Hey ${name},</h2>
          
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6;">Thank you for applying to be a PrepEdge Ambassador at ${collegeName}.</p>
          
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6;">After reviewing your application, we aren't moving forward at this time — we currently have limited spots per region.</p>
          
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6;">This doesn't mean PrepEdge isn't for you. Your free access to PrepEdge remains active. Keep preparing — placement season is coming.</p>
          
          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6;">If we open more spots, we'll reach out.</p>

          <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 30px;">Aryan<br>Founder, PrepEdge</p>
        </div>
      `,
    });

    if (error) console.error('Error sending rejection email:', error);
  } catch (error) {
    console.error('Failed to send rejection email:', error);
  }
};
