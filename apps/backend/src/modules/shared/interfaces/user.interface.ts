import { User } from '../../users/entities/user.entity';

export interface IUserService {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findMany(userIds: string[]): Promise<User[]>;
    findActiveUsers(): Promise<User[]>;
    searchUsers(query: string, limit?: number): Promise<User[]>;
    existsByEmail(email: string): Promise<boolean>;
}
