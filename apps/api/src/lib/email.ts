import nodemailer from 'nodemailer';

interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      emailConfig.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }

    // Check if basic email configuration is present
    if (emailConfig.host && emailConfig.auth) {
      try {
        this.transporter = nodemailer.createTransport(emailConfig);
        this.isConfigured = true;
        console.log('📧 Email service configured successfully');
      } catch (error) {
        console.log('⚠️ Email service configuration failed:', error);
        this.isConfigured = false;
      }
    } else {
      console.log('ℹ️ Email service not configured (missing SMTP settings)');
      this.isConfigured = false;
    }
  }

  public isEmailConfigured(): boolean {
    return this.isConfigured;
  }

  public async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Email not configured, would send to:', to, 'Subject:', subject);
      // Extract verification URL for console logging
      const urlMatch = html.match(/href="([^"]*verify-email[^"]*)"/) || html.match(/(http[^<\s]*verify-email[^<\s]*)/);
      if (urlMatch) {
        console.log('🔗 Verification URL (copy to browser):', urlMatch[1]);
      }
      return false;
    }

    try {
      // Add timeout to prevent hanging
      const emailPromise = this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@tessera.vote',
        to,
        subject,
        html,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email timeout after 10 seconds')), 10000);
      });

      const info = await Promise.race([emailPromise, timeoutPromise]);
      console.log('📧 Email sent successfully:', (info as any).messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  public async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verifyUrl = `${process.env.SITE_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    
    const subject = 'Verify your Tessera account';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2D5BFF;">Welcome to Tessera!</h1>
        <p>Thank you for registering for Tessera, the ranked choice voting platform.</p>
        <p>Please click the link below to verify your email address:</p>
        <p>
          <a href="${verifyUrl}" style="background: #2D5BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }
}

export const emailService = new EmailService();