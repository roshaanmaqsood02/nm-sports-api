import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationDocument } from '../schemas/notification.schema';
import { DeliveryStatus } from '../enums/notification.enum';

@Injectable()
export class PushChannel {
  private readonly logger = new Logger(PushChannel.name);
  private readonly enabled: boolean;
  private firebaseAdmin: any = null;

  constructor(private readonly config: ConfigService) {
    this.enabled = config.get<string>('PUSH_NOTIFICATIONS_ENABLED') === 'true';
    this.initFirebase();
  }

  private initFirebase(): void {
    if (!this.enabled) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require('firebase-admin');
      const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.config
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');
      const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn(
          '⚠️  Firebase credentials not configured — push disabled',
        );
        return;
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
      }

      this.firebaseAdmin = admin;
      this.logger.log('Firebase push initialized');
    } catch (err: any) {
      this.logger.error(`Firebase init failed: ${err?.message}`);
    }
  }

  async send(
    notification: NotificationDocument,
  ): Promise<{ status: DeliveryStatus; externalId?: string; error?: string }> {
    if (!this.enabled || !this.firebaseAdmin) {
      return { status: DeliveryStatus.SKIPPED };
    }

    if (!notification.deviceToken) {
      return { status: DeliveryStatus.SKIPPED };
    }

    try {
      const message = {
        token: notification.deviceToken,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
        },
        data: {
          type: notification.type,
          notificationId: (notification._id as any).toString(),
          ...(notification.actionUrl && { actionUrl: notification.actionUrl }),
          ...(notification.data
            ? Object.fromEntries(
                Object.entries(notification.data).map(([k, v]) => [
                  k,
                  String(v),
                ]),
              )
            : {}),
        },
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'nmsports_default',
            priority: 'high' as const,
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.firebaseAdmin.messaging().send(message);

      this.logger.log(
        `🔔 Push sent → ${notification.deviceToken.slice(0, 20)}... [${response}]`,
      );

      return { status: DeliveryStatus.SENT, externalId: response };
    } catch (err: any) {
      this.logger.error(`Push failed: ${err?.message}`);
      return { status: DeliveryStatus.FAILED, error: err?.message };
    }
  }

  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ success: number; failure: number }> {
    if (!this.enabled || !this.firebaseAdmin || tokens.length === 0) {
      return { success: 0, failure: 0 };
    }

    try {
      const message = {
        tokens,
        notification: { title, body },
        data: data ?? {},
        android: { priority: 'high' as const },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      };

      const response = await this.firebaseAdmin
        .messaging()
        .sendEachForMulticast(message);

      this.logger.log(
        `🔔 Multicast sent: ${response.successCount} success, ${response.failureCount} failed`,
      );

      return {
        success: response.successCount,
        failure: response.failureCount,
      };
    } catch (err: any) {
      this.logger.error(`Multicast push failed: ${err?.message}`);
      return { success: 0, failure: tokens.length };
    }
  }
}
