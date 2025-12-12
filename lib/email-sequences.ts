import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailSequence {
  id: string;
  name: string;
  emails: EmailTemplate[];
}

export interface EmailTemplate {
  delay: number; // Delay in hours after trigger
  subject: string;
  html: string;
  text?: string;
}

// Welcome sequence (triggered on signup)
export const WELCOME_SEQUENCE: EmailSequence = {
  id: 'welcome',
  name: 'Welcome Sequence',
  emails: [
    {
      delay: 0,
      subject: 'Welcome to GEO on Fire! 🚀',
      html: `
        <h1>Welcome to GEO on Fire!</h1>
        <p>Thank you for joining us. We're excited to help you optimize your content for AI platforms.</p>
        <p>Get started by:</p>
        <ul>
          <li>Running your first brand analysis</li>
          <li>Exploring competitor insights</li>
          <li>Getting GEO recommendations</li>
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/brand-monitor">Start Your First Analysis</a></p>
      `,
    },
    {
      delay: 24,
      subject: 'Tips for Better AI Visibility',
      html: `
        <h1>Tips for Better AI Visibility</h1>
        <p>Here are some quick tips to improve your GEO:</p>
        <ul>
          <li>Use clear, descriptive content</li>
          <li>Include relevant keywords naturally</li>
          <li>Provide comprehensive information</li>
          <li>Update content regularly</li>
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View Dashboard</a></p>
      `,
    },
  ],
};

// Onboarding sequence (triggered after first analysis)
export const ONBOARDING_SEQUENCE: EmailSequence = {
  id: 'onboarding',
  name: 'Onboarding Sequence',
  emails: [
    {
      delay: 0,
      subject: 'Your First Analysis is Complete!',
      html: `
        <h1>Your Analysis is Ready</h1>
        <p>Your brand analysis has been completed. Check out your results and see how AI platforms rank your brand.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/brand-monitor">View Results</a></p>
      `,
    },
  ],
};

/**
 * Send email using Resend
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from: string = process.env.EMAIL_FROM || 'noreply@geo-on-fire.com'
): Promise<void> {
  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Schedule email sequence
 */
export async function scheduleEmailSequence(
  userId: string,
  userEmail: string,
  sequence: EmailSequence
): Promise<void> {
  // In a production system, you'd use a job queue (e.g., Bull, BullMQ)
  // For now, we'll just send the first email immediately
  // and store the sequence in the database for future processing

  if (sequence.emails.length > 0) {
    const firstEmail = sequence.emails[0];
    await sendEmail(userEmail, firstEmail.subject, firstEmail.html);
  }

  // TODO: Store remaining emails in database and process with a job queue
  // This would require additional database tables and job processing
}

