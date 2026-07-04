import { getActiveSMSProvider } from './config.service';

export class SMSService {
  private static async getProvider() {
    return await getActiveSMSProvider();
  }

  static async sendOTP(phone: string, otp: string): Promise<boolean> {
    const provider = await this.getProvider();

    switch (provider.provider) {
      case 'MSG91':
        return this.sendMSG91OTP(phone, otp, provider.credentials);
      case 'TWILIO':
        return this.sendTwilioOTP(phone, otp, provider.credentials);
      case 'FAST2SMS':
        return this.sendFast2SMSOTP(phone, otp, provider.credentials);
      default:
        console.log(`Mock SMS to ${phone}: Your OTP is ${otp}`);
        return true;
    }
  }

  private static async sendMSG91OTP(phone: string, otp: string, credentials: any): Promise<boolean> {
    try {
      const response = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': credentials.authKey,
        },
        body: JSON.stringify({
          template_id: credentials.templateId,
          mobile: phone.replace('+91', ''),
          otp,
        }),
      });

      const data = await response.json();
      return data.type === 'success';
    } catch (error) {
      console.error('MSG91 SMS Error:', error);
      return false;
    }
  }

  private static async sendTwilioOTP(phone: string, otp: string, credentials: any): Promise<boolean> {
    try {
      const auth = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
          },
          body: new URLSearchParams({
            To: phone,
            From: credentials.phoneNumber,
            Body: `Your OneMartGo OTP is: ${otp}. Valid for 5 minutes.`,
          }),
        }
      );

      const data = await response.json();
      return data.status === 'queued' || data.status === 'sent';
    } catch (error) {
      console.error('Twilio SMS Error:', error);
      return false;
    }
  }

  private static async sendFast2SMSOTP(phone: string, otp: string, credentials: any): Promise<boolean> {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': credentials.apiKey,
        },
        body: JSON.stringify({
          route: 'otp',
          sender_id: credentials.senderId,
          message: `Your OneMartGo OTP is ${otp}`,
          variables_values: otp,
          flash: 0,
          numbers: phone.replace('+91', ''),
        }),
      });

      const data = await response.json();
      return data.return === true;
    } catch (error) {
      console.error('Fast2SMS Error:', error);
      return false;
    }
  }

  static async sendTransactionalSMS(phone: string, message: string): Promise<boolean> {
    const provider = await this.getProvider();
    console.log(`Transactional SMS to ${phone}: ${message} (Provider: ${provider.provider})`);
    return true;
  }
}
