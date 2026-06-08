import { Injectable, Logger } from '@nestjs/common';
import { NotificationDocument } from '../schemas/notification.schema';
import { DeliveryStatus } from '../enums/notification.enum';

@Injectable()
export class InAppChannel {
  private readonly logger = new Logger(InAppChannel.name);

  // In-app notifications are stored directly in DB
  // This channel just marks delivery as successful
  async send(
    notification: NotificationDocument,
  ): Promise<{ status: DeliveryStatus }> {
    this.logger.debug(
      `🔔 In-app notification stored: ${notification.type} → user ${notification.userId}`,
    );
    return { status: DeliveryStatus.DELIVERED };
  }
}
