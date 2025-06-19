import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.userRepository.create(userData);
        return this.userRepository.save(user);
    }

    async findById(id: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async update(id: string, userData: Partial<User>): Promise<User> {
        await this.userRepository.update(id, userData);
        const updatedUser = await this.findById(id);
        if (!updatedUser) {
            throw new Error(`User with id ${id} not found`);
        }
        return updatedUser;
    }

    async delete(id: string): Promise<void> {
        await this.userRepository.delete(id);
    }

    async exists(id: string): Promise<boolean> {
        const count = await this.userRepository.count({ where: { id } });
        return count > 0;
    }

    async existsByEmail(email: string): Promise<boolean> {
        const count = await this.userRepository.count({ where: { email } });
        return count > 0;
    }

    async findMany(userIds: string[]): Promise<User[]> {
        if (!userIds || userIds.length === 0) {
            return [];
        }
        return this.userRepository.findByIds(userIds);
    }

    async findActiveUsers(): Promise<User[]> {
        return this.userRepository.find({ where: { isActive: true } });
    }

    async updatePassword(id: string, hashedPassword: string): Promise<void> {
        await this.userRepository.update(id, { password: hashedPassword });
    }

    async updateLastLoginAt(id: string): Promise<void> {
        await this.userRepository.update(id, { lastLoginAt: new Date() });
    }

    async searchUsers(query: string, limit: number): Promise<User[]> {
        return this.userRepository
            .createQueryBuilder('user')
            .where('user.isActive = :isActive', { isActive: true })
            .andWhere('(user.name ILIKE :query OR user.email ILIKE :query)', {
                query: `%${query}%`,
            })
            .limit(limit)
            .orderBy('user.name', 'ASC')
            .getMany();
    }
}
