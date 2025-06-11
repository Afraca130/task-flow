import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  NotificationFilter,
  NotificationPaginationOptions,
  NotificationRepositoryPort,
  NotificationSummary,
} from '../../../application/ports/output/notification-repository.port';
import {
  Notification,
  NotificationDocument,
  NotificationPriority,
  NotificationType,
} from '../../../domain/schemas/notification.schema';

@Injectable()
export class NotificationRepository implements NotificationRepositoryPort {
  private readonly logger = new Logger(NotificationRepository.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(notification: Partial<NotificationDocument>): Promise<NotificationDocument> {
    try {
      const createdNotification = new this.notificationModel(notification);
      return await createdNotification.save();
    } catch (error) {
      this.logger.error('Failed to create notification', error);
      throw error;
    }
  }

  async createMany(notifications: Partial<NotificationDocument>[]): Promise<NotificationDocument[]> {
    try {
      const result = await this.notificationModel.insertMany(notifications);
    return result as NotificationDocument[];
    } catch (error) {
      this.logger.error('Failed to create multiple notifications', error);
      throw error;
    }
  }

  async findById(id: string): Promise<NotificationDocument | null> {
    try {
      return await this.notificationModel.findById(id).exec();
    } catch (error) {
      this.logger.error(`Failed to find notification by id: ${id}`, error);
      throw error;
    }
  }

  async findByUserId(
    userId: string,
    filter: Partial<NotificationFilter>,
    pagination: NotificationPaginationOptions,
  ): Promise<{ notifications: NotificationDocument[]; total: number }> {
    try {
      const query = this.buildFilterQuery({ ...filter, userId });
      const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      const validSortFields = ['createdAt', 'updatedAt', 'title', 'type', 'isRead'];
      const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const safeSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

      const skip = (page - 1) * limit;
        const sort: Record<string, 1 | -1> = {
        [safeSortBy]: safeSortOrder === 'desc' ? -1 : 1
      };
      const [notifications, total] = await Promise.all([
        this.notificationModel
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.notificationModel.countDocuments(query).exec(),
      ]);

      return { notifications, total };
    } catch (error) {
      this.logger.error(`Failed to find notifications for user: ${userId}`, error);
      throw error;
    }
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    try {
      return await this.notificationModel
        .countDocuments({ userId, isRead: false })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to count unread notifications for user: ${userId}`, error);
      throw error;
    }
  }

  async getSummaryByUserId(userId: string): Promise<NotificationSummary> {
    try {
      const [
        totalCount,
        unreadCount,
        highPriorityCount,
        urgentCount,
        typeCountsResult,
      ] = await Promise.all([
        this.notificationModel.countDocuments({ userId }).exec(),
        this.notificationModel.countDocuments({ userId, isRead: false }).exec(),
        this.notificationModel.countDocuments({
          userId,
          priority: NotificationPriority.HIGH,
          isRead: false
        }).exec(),
        this.notificationModel.countDocuments({
          userId,
          priority: NotificationPriority.URGENT,
          isRead: false
        }).exec(),
        this.notificationModel.aggregate([
          { $match: { userId } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]).exec(),
      ]);

      const countByType = typeCountsResult.reduce(
        (acc, item) => {
          acc[item._id as NotificationType] = item.count;
          return acc;
        },
        {} as Record<NotificationType, number>,
      );

      return {
        totalCount,
        unreadCount,
        highPriorityCount,
        urgentCount,
        countByType,
      };
    } catch (error) {
      this.logger.error(`Failed to get notification summary for user: ${userId}`, error);
      throw error;
    }
  }

  async markAsRead(id: string): Promise<NotificationDocument | null> {
    try {
      return await this.notificationModel
        .findByIdAndUpdate(
          id,
          {
            isRead: true,
            readAt: new Date(),
            updatedAt: new Date(),
          },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${id}`, error);
      throw error;
    }
  }

  async markManyAsRead(ids: string[]): Promise<number> {
    try {
      const result = await this.notificationModel
        .updateMany(
          { _id: { $in: ids } },
          {
            isRead: true,
            readAt: new Date(),
            updatedAt: new Date(),
          },
        )
        .exec();

      return result.modifiedCount;
    } catch (error) {
      this.logger.error('Failed to mark multiple notifications as read', error);
      throw error;
    }
  }

  async markAllAsReadByUserId(userId: string, type?: NotificationType): Promise<number> {
    try {
      const filter: FilterQuery<NotificationDocument> = {
        userId,
        isRead: false
      };

      if (type) {
        filter.type = type;
      }

      const result = await this.notificationModel
        .updateMany(
          filter,
          {
            isRead: true,
            readAt: new Date(),
            updatedAt: new Date(),
          },
        )
        .exec();

      return result.modifiedCount;
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read for user: ${userId}`, error);
      throw error;
    }
  }

  async markAsUnread(id: string): Promise<NotificationDocument | null> {
    try {
      return await this.notificationModel
        .findByIdAndUpdate(
          id,
          {
            isRead: false,
            readAt: null,
            updatedAt: new Date(),
          },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.logger.error(`Failed to mark notification as unread: ${id}`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.notificationModel.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error) {
      this.logger.error(`Failed to delete notification: ${id}`, error);
      throw error;
    }
  }

  async deleteMany(ids: string[]): Promise<number> {
    try {
      const result = await this.notificationModel
        .deleteMany({ _id: { $in: ids } })
        .exec();

      return result.deletedCount || 0;
    } catch (error) {
      this.logger.error('Failed to delete multiple notifications', error);
      throw error;
    }
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    try {
      const result = await this.notificationModel
        .deleteMany({ userId })
        .exec();

      return result.deletedCount || 0;
    } catch (error) {
      this.logger.error(`Failed to delete all notifications for user: ${userId}`, error);
      throw error;
    }
  }

  async deleteExpiredNotifications(): Promise<number> {
    try {
      const result = await this.notificationModel
        .deleteMany({
          expiresAt: { $lte: new Date() },
        })
        .exec();

      return result.deletedCount || 0;
    } catch (error) {
      this.logger.error('Failed to delete expired notifications', error);
      throw error;
    }
  }

  async deleteOldReadNotifications(daysOld: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.notificationModel
        .deleteMany({
          isRead: true,
          readAt: { $lte: cutoffDate },
        })
        .exec();

      return result.deletedCount || 0;
    } catch (error) {
      this.logger.error(`Failed to delete old read notifications (${daysOld} days)`, error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<NotificationDocument>): Promise<NotificationDocument | null> {
    try {
      return await this.notificationModel
        .findByIdAndUpdate(
          id,
          { ...updates, updatedAt: new Date() },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.logger.error(`Failed to update notification: ${id}`, error);
      throw error;
    }
  }

  async findRecentByUserId(userId: string, limit = 10): Promise<NotificationDocument[]> {
    try {
      return await this.notificationModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Failed to find recent notifications for user: ${userId}`, error);
      throw error;
    }
  }

  async exists(filter: Partial<NotificationFilter>): Promise<boolean> {
    try {
      const query = this.buildFilterQuery(filter);
      const count = await this.notificationModel.countDocuments(query).exec();
      return count > 0;
    } catch (error) {
      this.logger.error('Failed to check notification existence', error);
      throw error;
    }
  }

  private buildFilterQuery(filter: Partial<NotificationFilter>): FilterQuery<NotificationDocument> {
    const query: FilterQuery<NotificationDocument> = {};

    if (filter.userId) {
      query.userId = filter.userId;
    }

    if (filter.isRead !== undefined) {
      query.isRead = filter.isRead;
    }

    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.priority) {
      query.priority = filter.priority;
    }

    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { message: { $regex: filter.search, $options: 'i' } },
      ];
    }

    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) {
        query.createdAt.$gte = filter.startDate;
      }
      if (filter.endDate) {
        query.createdAt.$lte = filter.endDate;
      }
    }

    return query;
  }
}
