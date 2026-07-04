import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { otpTokens, users } from '@/db/schema';
import { verifyOTP, generateReferralCode } from '@/lib/otp';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { eq, and, lt } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({
  identifier: z.string().min(1),
  otp: z.string().length(6),
  purpose: z.enum(['login', 'register', 'verify']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, otp, purpose } = schema.parse(body);

    const [otpRecord] = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.identifier, identifier),
          eq(otpTokens.purpose, purpose),
          eq(otpTokens.isUsed, false)
        )
      )
      .orderBy(otpTokens.createdAt)
      .limit(1);

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      );
    }

    if ((otpRecord.attempts || 0) >= 5) {
      return NextResponse.json(
        { error: 'Too many attempts. Request a new OTP.' },
        { status: 400 }
      );
    }

    const isValid = await verifyOTP(otp, otpRecord.otpHash);

    if (!isValid) {
      await db
        .update(otpTokens)
        .set({ attempts: (otpRecord.attempts || 0) + 1 })
        .where(eq(otpTokens.id, otpRecord.id));

      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    await db
      .update(otpTokens)
      .set({ isUsed: true })
      .where(eq(otpTokens.id, otpRecord.id));

    const isEmail = identifier.includes('@');
    const existingUser = await db
      .select()
      .from(users)
      .where(isEmail ? eq(users.email, identifier) : eq(users.phone, identifier))
      .limit(1);

    let user;

    if (existingUser.length === 0 && purpose === 'register') {
      const [newUser] = await db.insert(users).values({
        email: isEmail ? identifier : null,
        phone: isEmail ? null : identifier,
        isEmailVerified: isEmail,
        isPhoneVerified: !isEmail,
        role: 'CUSTOMER',
        referralCode: generateReferralCode(),
      }).returning();

      user = newUser;
    } else if (existingUser.length > 0) {
      user = existingUser[0];

      if (purpose === 'verify') {
        await db
          .update(users)
          .set({
            isEmailVerified: isEmail ? true : user.isEmailVerified,
            isPhoneVerified: isEmail ? user.isPhoneVerified : true,
          })
          .where(eq(users.id, user.id));
      }
    } else {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email || undefined,
      phone: user.phone || undefined,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
      email: user.email || undefined,
      phone: user.phone || undefined,
    });

    await db.update(users).set({
      lastLoginAt: new Date(),
      lastLoginIp: request.headers.get('x-forwarded-for') || 'unknown',
    }).where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 400 }
    );
  }
}
