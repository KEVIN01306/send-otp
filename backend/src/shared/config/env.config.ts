import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  adminMasterKey: process.env.ADMIN_MASTER_KEY || 'super_secret_admin_master_key_123456',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Auth Service <onboarding@resend.dev>',
  otp: {
    expirationMinutes: parseInt(process.env.OTP_EXPIRATION_MINUTES || '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
    cooldownSeconds: parseInt(process.env.OTP_COOLDOWN_SECONDS || '60', 10),
  },
  isProduction: process.env.NODE_ENV === 'production',
};
