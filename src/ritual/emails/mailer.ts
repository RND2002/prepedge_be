import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
export const RITUAL_FROM_EMAIL = 'noreply@prepedge.online'; // Or a specific ritual email if preferred

export const sendRitualEmail = async (to: string, subject: string, html: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `PrepEdge Ritual <${RITUAL_FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('[Ritual Email] Error sending email:', error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (error) {
    console.error('[Ritual Email] Failed to send email:', error);
    return { success: false, error };
  }
};
