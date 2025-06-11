import { NotificationDocument, NotificationType, NotificationPriority } from '../../../domain/schemas/notification.schema';

export interface NotificationFilter {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationPaginationOptions {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'priority' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationSummary {
  totalCount: number;
  unreadCount: number;
  highPriorityCount: number;
  urgentCount: number;
  countByType: Record<NotificationType, number>;
}

export interface NotificationRepositoryPort {
  /**
   * 새 알림 생성
   */
  create(notification: Partial<NotificationDocument>): Promise<NotificationDocument>;

  /**
   * 여러 알림 일괄 생성
   */
  createMany(notifications: Partial<NotificationDocument>[]): Promise<NotificationDocument[]>;

  /**
   * ID로 알림 조회
   */
  findById(id: string): Promise<NotificationDocument | null>;

  /**
   * 사용자의 알림 목록 조회 (페이지네이션)
   */
  findByUserId(
    userId: string,
    filter: Partial<NotificationFilter>,
    pagination: NotificationPaginationOptions
  ): Promise<{
    notifications: NotificationDocument[];
    total: number;
  }>;

  /**
   * 사용자의 읽지 않은 알림 개수 조회
   */
  countUnreadByUserId(userId: string): Promise<number>;

  /**
   * 사용자의 알림 요약 정보 조회
   */
  getSummaryByUserId(userId: string): Promise<NotificationSummary>;

  /**
   * 알림을 읽음으로 표시
   */
  markAsRead(id: string): Promise<NotificationDocument | null>;

  /**
   * 여러 알림을 읽음으로 표시
   */
  markManyAsRead(ids: string[]): Promise<number>;

  /**
   * 사용자의 모든 알림을 읽음으로 표시
   */
  markAllAsReadByUserId(userId: string, type?: NotificationType): Promise<number>;

  /**
   * 알림을 읽지 않음으로 표시
   */
  markAsUnread(id: string): Promise<NotificationDocument | null>;

  /**
   * 알림 삭제
   */
  delete(id: string): Promise<boolean>;

  /**
   * 여러 알림 삭제
   */
  deleteMany(ids: string[]): Promise<number>;

  /**
   * 사용자의 모든 알림 삭제
   */
  deleteAllByUserId(userId: string): Promise<number>;

  /**
   * 만료된 알림 정리
   */
  deleteExpiredNotifications(): Promise<number>;

  /**
   * 오래된 읽은 알림 정리 (예: 30일 이상)
   */
  deleteOldReadNotifications(daysOld: number): Promise<number>;

  /**
   * 알림 업데이트
   */
  update(id: string, updates: Partial<NotificationDocument>): Promise<NotificationDocument | null>;

  /**
   * 사용자의 최근 알림 조회 (실시간 알림용)
   */
  findRecentByUserId(userId: string, limit?: number): Promise<NotificationDocument[]>;

  /**
   * 특정 조건의 알림 존재 여부 확인
   */
  exists(filter: Partial<NotificationFilter>): Promise<boolean>;
} 