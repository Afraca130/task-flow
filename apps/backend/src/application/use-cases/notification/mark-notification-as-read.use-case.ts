import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationRepositoryPort } from '../../ports/output/notification-repository.port';
import { NotificationResponseDto } from '../../../presentation/dto/response/notification-response.dto';

export interface MarkNotificationAsReadCommand {
  userId: string;
  notificationId: string;
}

@Injectable()
export class MarkNotificationAsReadUseCase {
  constructor(
    @Inject('NotificationRepositoryPort')
    private readonly notificationRepository: NotificationRepositoryPort,
  ) {}

  async execute(command: MarkNotificationAsReadCommand): Promise<NotificationResponseDto> {
    const { userId, notificationId } = command;

    // 알림 존재 여부 및 소유권 확인
    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('해당 알림에 대한 권한이 없습니다.');
    }

    // 이미 읽은 알림인 경우 그대로 반환
    if (notification.isRead) {
      return NotificationResponseDto.fromDocument(notification);
    }

    // 읽음 처리
    const updatedNotification = await this.notificationRepository.markAsRead(notificationId);
    
    if (!updatedNotification) {
      throw new Error('알림 읽음 처리에 실패했습니다.');
    }

    return NotificationResponseDto.fromDocument(updatedNotification);
  }
} 