import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { otpTokens, users } from '@/db/schema';
import { generateOTP, hashOTP } from '@/lib/otp';
import { SMSService } from '@/lib/sms.service';
import { EmailService } from '@/lib/email.service';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({
  identifier: z.string().min(1),
  type: z.enum(['phone', 'email']),
  purpose: z.enum(['login', 'register', 'verify']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, type, purpose } = schema.parse(body);

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await db.insert(otpTokens).values({
      identifier,
      otpHash,
      purpose,
      expiresAt,
      isUsed: false,
      attempts: 0,
    });

    if (type === 'phone') {
      await SMSService.sendOTP(identifier, otp);
    } else {
      await EmailService.sendOTPEmail(identifier, otp);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresAt,
    });
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 400 }
    );
  }
}
