import { Injectable, Inject } from '@nestjs/common';
import {
  NotificationRepositoryPort,
  NotificationFilter,
  NotificationPaginationOptions,
} from '../../ports/output/notification-repository.port';
import { GetNotificationsQueryDto } from '../../../presentation/dto/request/notification-query.dto';
import { PaginatedNotificationResponseDto } from '../../../presentation/dto/response/notification-response.dto';

export interface GetNotificationsCommand {
  userId: string;
  query: GetNotificationsQueryDto;
}

@Injectable()
export class GetNotificationsUseCase {
  constructor(
    @Inject('NotificationRepositoryPort')
    private readonly notificationRepository: NotificationRepositoryPort,
  ) {}

  async execute(command: GetNotificationsCommand): Promise<PaginatedNotificationResponseDto> {
    const { userId, query } = command;

    const filter: Partial<NotificationFilter> = {
      userId,
      isRead: query.isRead,
      type: query.type,
      priority: query.priority,
      search: query.search,
    };

    const pagination: NotificationPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const { notifications, total } = await this.notificationRepository.findByUserId(
      userId,
      filter,
      pagination,
    );

    return PaginatedNotificationResponseDto.create(
      notifications,
      pagination.page,
      pagination.limit,
      total,
    );
  }
} 