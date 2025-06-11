import { Injectable, Inject } from '@nestjs/common';
import { NotificationRepositoryPort } from '../../ports/output/notification-repository.port';
import { NotificationSummaryResponseDto } from '../../../presentation/dto/response/notification-response.dto';

export interface GetNotificationSummaryCommand {
  userId: string;
}

@Injectable()
export class GetNotificationSummaryUseCase {
  constructor(
    @Inject('NotificationRepositoryPort')
    private readonly notificationRepository: NotificationRepositoryPort,
  ) {}

  async execute(command: GetNotificationSummaryCommand): Promise<NotificationSummaryResponseDto> {
    const { userId } = command;

    const summary = await this.notificationRepository.getSummaryByUserId(userId);

    return new NotificationSummaryResponseDto(summary);
  }
} 