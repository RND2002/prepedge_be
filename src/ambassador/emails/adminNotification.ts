import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'noreply@prepedge.online';

export const sendAdminNotification = async (applicationDetails: any) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@prepedge.online';
  
  try {
    const { data, error } = await resend.emails.send({
      from: `PrepEdge System <${fromEmail}>`,
      to: [adminEmail],
      subject: `New Ambassador Application — ${applicationDetails.fullName} from ${applicationDetails.collegeName}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
          <h2 style="color: #2DD4BF; font-size: 20px; font-weight: 700; margin-bottom: 20px;">New Ambassador Application</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #333; color: #A0A0A0; width: 150px;">Name</td><td style="padding: 8px 0; border-bottom: 1px solid #333;">${applicationDetails.fullName}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #333; color: #A0A0A0;">Email</td><td style="padding: 8px 0; border-bottom: 1px solid #333;">${applicationDetails.email}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #333; color: #A0A0A0;">Phone</td><td style="padding: 8px 0; border-bottom: 1px solid #333;">${applicationDetails.phone}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #333; color: #A0A0A0;">College</td><td style="padding: 8px 0; border-bottom: 1px solid #333;">${applicationDetails.collegeName}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #333; color: #A0A0A0;">Location</td><td style="padding: 8px 0; border-bottom: 1px solid #333;">${applicationDetails.city}, ${applicationDetails.state}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #333; color: #A0A0A0;">Branch/Year</td><td style="padding: 8px 0; border-bottom: 1px solid #333;">${applicationDetails.branch} - ${applicationDetails.currentYear} (Class of ${applicationDetails.graduationYear})</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #333; color: #A0A0A0;">LinkedIn</td><td style="padding: 8px 0; border-bottom: 1px solid #333;">${applicationDetails.linkedinUrl || 'Not provided'}</td></tr>
          </table>
          
          <h3 style="color: #F0A500; font-size: 16px; margin-top: 20px;">Why Ambassador?</h3>
          <p style="font-size: 14px; color: #A0A0A0; background: #1A1A1A; padding: 15px; border-radius: 6px;">${applicationDetails.whyAmbassador}</p>
          
          <h3 style="color: #F0A500; font-size: 16px; margin-top: 20px;">Communities Reachable</h3>
          <p style="font-size: 14px; color: #A0A0A0; background: #1A1A1A; padding: 15px; border-radius: 6px;">${applicationDetails.communitiesCanReach}</p>
          
        </div>
      `,
    });

    if (error) console.error('Error sending admin notification email:', error);
  } catch (error) {
    console.error('Failed to send admin notification email:', error);
  }
};
