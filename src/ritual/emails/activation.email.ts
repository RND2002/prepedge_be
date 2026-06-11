import { ActivationEmailProps } from './types';
import { sendRitualEmail } from './mailer';

export const sendActivationEmail = async (to: string, props: ActivationEmailProps) => {
  const subject = `Your Ritual begins. ${props.totalDays} days to ${props.company}.`;

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D0D0D; color: #E0E0E0; padding: 40px; border-radius: 12px; border: 1px solid #1A1A1A;">
      <p style="font-size: 16px; color: #E0E0E0;">Hey ${props.firstName},</p>
      
      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px;">Your Prepedge Ritual is live.</p>
      
      <p style="font-size: 16px; color: #F0A500; font-weight: 600; margin-top: 24px;">
        ${props.totalDays} days. ${props.company}. ${props.role}.
      </p>

      <p style="font-size: 16px; color: #A0A0A0; line-height: 1.6; margin-top: 24px;">
        We've looked at your history. We know where you're strong.<br />
        We know what needs work. And we've built every day around that.
      </p>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 24px;">Here's what the next ${props.totalDays} days look like:</p>

      <ul style="list-style-type: none; padding: 0; margin-top: 16px; color: #A0A0A0; line-height: 1.8;">
        <li>→ <strong style="color: #E0E0E0;">Days 1-${props.prepDays}:</strong> Focused on what matters most for you</li>
        <li>→ <strong style="color: #E0E0E0;">Day ${props.companyFocusDay}:</strong> Everything specific to ${props.company}</li>
        <li>→ <strong style="color: #E0E0E0;">Day ${props.warmupDay}:</strong> Light. Confident. Ready.</li>
        <li>→ <strong style="color: #E0E0E0;">${props.interviewDate}:</strong> Game day.</li>
      </ul>

      <p style="font-size: 16px; color: #A0A0A0; margin-top: 32px;">
        You'll hear from us every morning.<br />
        Do the work. Trust the plan.
      </p>

      <p style="font-size: 16px; color: #E0E0E0; margin-top: 32px;">
        See you tomorrow.<br />
        <strong>Prepedge</strong>
      </p>
    </div>
  `;

  return sendRitualEmail(to, subject, html);
};
