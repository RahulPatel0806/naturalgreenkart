/**
 * SMS delivery abstraction (Strategy pattern).
 * In dev / when no provider is configured we log the message. Real providers
 * (Twilio, MSG91, …) implement `SmsSender` without touching call sites.
 */
import { env } from '@/core/config/env';
import { logger } from '@/core/logger/logger';

export interface SmsSender {
  send(to: string, message: string): Promise<void>;
}

class LogSmsSender implements SmsSender {
  async send(to: string, message: string): Promise<void> {
    logger.info({ to, channel: 'sms-dev' }, `[DEV SMS] → ${to}: ${message}`);
  }
}

// Placeholder for a real provider. Implement `send` against the provider HTTP API.
// class Msg91SmsSender implements SmsSender { ... }

function resolveSender(): SmsSender {
  switch (env.SMS_PROVIDER) {
    // case 'msg91': return new Msg91SmsSender();
    default:
      return new LogSmsSender();
  }
}

export const smsSender: SmsSender = resolveSender();

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  await smsSender.send(phone, `${code} is your Natural greenkart verification code. Valid for ${env.OTP_TTL / 60} minutes.`);
}
