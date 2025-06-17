import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsRepository {
    constructor(
        @InjectRepository(Notification)
        private readonly repository: Repository<Notification>,
    ) { }

    async save(notification: Notification): Promise<Notification> {
        return await this.repository.save(notification);
    }

    async findById(id: string): Promise<Notification | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['user', 'task', 'project']
        });
    }

    async findByUserId(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
        const queryBuilder = this.repository.createQueryBuilder('notification');

        queryBuilder
            .leftJoinAndSelect('notification.user', 'user')
            .leftJoinAndSelect('notification.task', 'task')
            .leftJoinAndSelect('notification.project', 'project')
            .where('notification.userId = :userId', { userId });

        if (unreadOnly) {
            queryBuilder.andWhere('notification.isRead = false');
        }

        return await queryBuilder
            .orderBy('notification.createdAt', 'DESC')
            .getMany();
    }

    async markAllAsReadForUser(userId: string): Promise<void> {
        await this.repository.update(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );
    }

    async getUnreadCountForUser(userId: string): Promise<number> {
        return await this.repository.count({
            where: { userId, isRead: false }
        });
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.repository.delete({ userId });
    }

    async findByRelatedEntity(entityType: string, entityId: string): Promise<Notification[]> {
        return await this.repository.find({
            where: {
                relatedEntityType: entityType,
                relatedEntityId: entityId
            },
            relations: ['user']
        });
    }
}
