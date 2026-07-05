import { env } from '../../config/env';

/**
 * Phase-1 email helper.
 *
 * The repo does not currently ship an SMTP client dependency, so this service
 * intentionally degrades to a no-op logger while keeping the integration point
 * in place for a later transport swap.
 */
export class EmailService {
  async sendInvite(email: string, token: string, orgName: string, inviterName: string) {
    const acceptUrl = `${env.FRONTEND_URL}/app/organizations/invites?token=${token}`;

    // eslint-disable-next-line no-console
    console.info('[email] invite prepared', {
      to: email,
      orgName,
      inviterName,
      acceptUrl,
    });
  }
}

export const emailService = new EmailService();
