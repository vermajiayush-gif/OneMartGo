import { getActiveEmailProvider } from './config.service';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static async getProvider() {
    return await getActiveEmailProvider();
  }

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    const provider = await this.getProvider();

    switch (provider.provider) {
      case 'RESEND':
        return this.sendResendEmail(options, provider.credentials);
      case 'SENDGRID':
        return this.sendSendGridEmail(options, provider.credentials);
      case 'SMTP':
        return this.sendSMTPEmail(options, provider.credentials);
      default:
        console.log(`Mock Email to ${options.to}: ${options.subject}`);
        return true;
    }
  }

  private static async sendResendEmail(options: EmailOptions, credentials: any): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
        body: JSON.stringify({
          from: credentials.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      const data = await response.json();
      return !!data.id;
    } catch (error) {
      console.error('Resend Email Error:', error);
      return false;
    }
  }

  private static async sendSendGridEmail(options: EmailOptions, credentials: any): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: options.to }],
          }],
          from: { email: credentials.fromEmail },
          subject: options.subject,
          content: [{
            type: 'text/html',
            value: options.html,
          }],
        }),
      });

      return response.status === 202;
    } catch (error) {
      console.error('SendGrid Email Error:', error);
      return false;
    }
  }

  private static async sendSMTPEmail(options: EmailOptions, credentials: any): Promise<boolean> {
    console.log('SMTP Email would be sent:', options);
    return true;
  }

  static async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Your OneMartGo OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>OneMartGo Verification</h2>
          <p>Your OTP for login is:</p>
          <h1 style="color: #7C3AED; font-size: 32px;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
      text: `Your OneMartGo OTP is: ${otp}. Valid for 5 minutes.`,
    });
  }

  static async sendOrderConfirmation(email: string, orderNumber: string, total: number): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Order Confirmed - ${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Confirmed!</h2>
          <p>Thank you for your order on OneMartGo.</p>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Total Amount:</strong> ₹${total.toFixed(2)}</p>
          <p>We'll notify you once your order is shipped.</p>
        </div>
      `,
    });
  }
}
