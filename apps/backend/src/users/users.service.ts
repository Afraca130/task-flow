import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UsersService {
    constructor(
        private readonly userRepository: UserRepository,
    ) { }

    async findById(id: string): Promise<User | null> {
        return await this.userRepository.findById(id);
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findByEmail(email);
    }

    async createUser(userData: Partial<User>): Promise<User> {
        return await this.userRepository.create(userData);
    }

    async updateUser(id: string, userData: Partial<User>): Promise<User> {
        return await this.userRepository.update(id, userData);
    }

    async deleteUser(id: string): Promise<void> {
        await this.userRepository.delete(id);
    }

    async findActiveUsers(): Promise<User[]> {
        return await this.userRepository.findActiveUsers();
    }

    async existsByEmail(email: string): Promise<boolean> {
        return await this.userRepository.existsByEmail(email);
    }

    async updatePassword(id: string, hashedPassword: string): Promise<void> {
        await this.userRepository.updatePassword(id, hashedPassword);
    }

    async updateLastLoginAt(id: string): Promise<void> {
        await this.userRepository.updateLastLoginAt(id);
    }

    async searchUsers(query: string, limit: number = 10): Promise<User[]> {
        return await this.userRepository.searchUsers(query, limit);
    }
}
