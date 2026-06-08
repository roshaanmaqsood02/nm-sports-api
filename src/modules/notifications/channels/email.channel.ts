import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationDocument } from '../schemas/notification.schema';
import { DeliveryStatus } from '../enums/notification.enum';
import { EmailTemplates } from '../templates/email.templates';

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly enabled: boolean;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly config: ConfigService) {
    this.enabled = config.get<string>('EMAIL_NOTIFICATIONS_ENABLED') === 'true';
    this.fromEmail = config.get<string>(
      'SMTP_FROM_EMAIL',
      'noreply@nmsports.com',
    );
    this.fromName = config.get<string>('SMTP_FROM_NAME', 'NMSports');

    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: config.get<number>('SMTP_PORT', 587),
      secure: config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: config.get<string>('SMTP_USER', ''),
        pass: config.get<string>('SMTP_PASS', ''),
      },
      pool: true,
      maxConnections: 5,
    });
  }

  async send(notification: NotificationDocument): Promise<{
    status: DeliveryStatus;
    externalId?: string;
    error?: string;
  }> {
    if (!this.enabled) {
      return { status: DeliveryStatus.SKIPPED };
    }

    if (!notification.userEmail) {
      return { status: DeliveryStatus.SKIPPED };
    }

    try {
      const html = this.buildHtml(notification);

      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: notification.userEmail,
        subject: notification.title,
        text: notification.body,
        html,
      });

      this.logger.log(
        `📧 Email sent → ${notification.userEmail} [${info.messageId}]`,
      );

      return {
        status: DeliveryStatus.SENT,
        externalId: info.messageId,
      };
    } catch (err: any) {
      this.logger.error(
        `Email failed → ${notification.userEmail}: ${err?.message}`,
      );
      return { status: DeliveryStatus.FAILED, error: err?.message };
    }
  }

  // ─── Build HTML from notification type + data ─────────────────
  private buildHtml(notification: NotificationDocument): string {
    const data = notification.data ?? {};
    const name = data.recipientName ?? data.name ?? 'User';

    try {
      switch (notification.type) {
        case 'welcome':
          return EmailTemplates.welcome({
            name,
            loginUrl: data.loginUrl ?? data.actionUrl,
          });

        case 'password_reset':
          return EmailTemplates.passwordReset({
            name,
            resetUrl: data.resetUrl ?? data.actionUrl ?? '#',
            expiresIn: data.expiresIn ?? '1 hour',
          });

        case 'password_changed':
          return EmailTemplates.passwordChanged({
            name,
            ipAddress: data.ipAddress,
            time: data.time ?? new Date().toLocaleString(),
          });

        case 'match_scheduled':
          return EmailTemplates.matchScheduled({
            name,
            homeTeam: data.homeTeam ?? data.teamName ?? 'Home Team',
            visitorTeam:
              data.visitorTeam ?? data.opponentTeam ?? 'Visitor Team',
            date:
              data.date ??
              data.scheduledDate ??
              new Date().toLocaleDateString(),
            time:
              data.time ??
              data.scheduledTime ??
              new Date().toLocaleTimeString(),
            location: data.location ?? data.venue ?? 'TBD',
            matchUrl: data.matchUrl ?? data.actionUrl,
          });

        case 'match_reminder':
          return EmailTemplates.matchReminder({
            name,
            homeTeam: data.homeTeam ?? data.teamName ?? 'Home Team',
            visitorTeam:
              data.visitorTeam ?? data.opponentTeam ?? 'Visitor Team',
            startsIn: data.startsIn ?? data.remainingTime ?? '1 hour',
            location: data.location ?? data.venue ?? 'TBD',
            matchUrl: data.matchUrl ?? data.actionUrl,
          });

        case 'match_completed':
          return EmailTemplates.matchCompleted({
            name,
            homeTeam: data.homeTeam ?? data.teamName ?? 'Home Team',
            visitorTeam:
              data.visitorTeam ?? data.opponentTeam ?? 'Visitor Team',
            homeScore: data.homeScore ?? data.homeTeamScore ?? 0,
            visitorScore: data.visitorScore ?? data.visitorTeamScore ?? 0,
            matchUrl: data.matchUrl ?? data.actionUrl,
          });

        case 'team_member_added':
          return EmailTemplates.teamMemberAdded({
            name,
            teamName: data.teamName ?? data.team ?? 'Team',
            role: data.role ?? 'Member',
            teamUrl: data.teamUrl ?? data.actionUrl,
          });

        case 'staff_invited':
          return EmailTemplates.staffInvited({
            name,
            orgName: data.organizationName ?? data.orgName ?? 'Organization',
            inviteUrl: data.inviteUrl ?? data.actionUrl ?? '#',
            expiresIn: data.expiresIn ?? '7 days',
          });

        case 'registration_submitted':
          return EmailTemplates.registrationSubmitted({
            name,
            referenceNumber: data.referenceNumber ?? data.reference ?? 'N/A',
            orgName: data.organizationName ?? data.orgName ?? 'Organization',
            expectedDate: data.expectedDate,
          });

        case 'export_completed':
          return EmailTemplates.exportCompleted({
            name,
            fileName: data.fileName ?? data.filename ?? 'export',
            totalRecords: data.totalRecords ?? data.recordCount ?? 0,
            downloadUrl: data.downloadUrl ?? data.actionUrl,
          });

        case 'contract_expiring':
          return EmailTemplates.contractExpiring({
            name,
            playerName: data.playerName ?? data.name ?? 'Player',
            teamName: data.teamName ?? data.team ?? 'Team',
            expiryDate:
              data.expiryDate ?? data.date ?? new Date().toISOString(),
            daysLeft: data.daysLeft ?? data.daysRemaining ?? 30,
          });

        case 'system_announcement':
          return EmailTemplates.systemAnnouncement({
            name,
            subject: notification.title,
            message: notification.body,
            actionUrl: notification.actionUrl ?? data.actionUrl,
            actionLabel: notification.actionLabel ?? data.actionLabel,
          });

        default:
          // Generic fallback for unknown notification types
          return EmailTemplates.systemAnnouncement({
            name,
            subject: notification.title,
            message: notification.body,
            actionUrl: notification.actionUrl,
            actionLabel: notification.actionLabel,
          });
      }
    } catch (error) {
      this.logger.error(
        `Failed to build HTML for notification type ${notification.type}: ${error}`,
      );
      // Fallback to plain text in HTML wrapper
      return `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>${this.escapeHtml(notification.title)}</h2>
          <p>${this.escapeHtml(notification.body)}</p>
          ${notification.actionUrl ? `<a href="${this.escapeHtml(notification.actionUrl)}">${this.escapeHtml(notification.actionLabel || 'Click here')}</a>` : ''}
          <hr />
          <p style="color: #666; font-size: 12px;">NMSports Notification System</p>
        </div>
      `;
    }
  }

  // Helper method to prevent XSS attacks
  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email transporter verified successfully');
      return true;
    } catch (error) {
      this.logger.error(`Email transporter verification failed: ${error}`);
      return false;
    }
  }

  // Utility method to test connection with custom settings
  async testConnection(config: {
    host: string;
    port: number;
    user: string;
    pass: string;
  }): Promise<boolean> {
    try {
      const testTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });
      await testTransporter.verify();
      return true;
    } catch (error) {
      this.logger.error(`Test connection failed: ${error}`);
      return false;
    }
  }
}
