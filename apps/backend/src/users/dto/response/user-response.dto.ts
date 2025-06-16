import { User } from '@/users/entities/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';


@Exclude()
export class UserResponseDto {
    @ApiProperty({
        description: 'User unique identifier',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly id: string;

    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
        format: 'email',
    })
    @Expose()
    readonly email: string;

    @ApiProperty({
        description: 'User full name',
        example: 'John Doe',
    })
    @Expose()
    readonly name: string;

    @ApiPropertyOptional({
        description: 'User profile color',
        example: '#3B82F6',
        pattern: '^#[0-9A-Fa-f]{6}$',
    })
    @Expose()
    readonly profileColor?: string;

    @ApiProperty({
        description: 'Account creation timestamp',
        example: '2023-12-01T10:00:00Z',
        format: 'date-time',
    })
    @Expose()
    readonly createdAt: Date;

    @ApiProperty({
        description: 'Account last update timestamp',
        example: '2023-12-01T10:00:00Z',
        format: 'date-time',
    })
    @Expose()
    readonly updatedAt: Date;

    constructor(partial: Partial<UserResponseDto>) {
        Object.assign(this, partial);
    }

    static fromDomain(user: User): UserResponseDto {
        return new UserResponseDto({
            id: user.id,
            email: user.email,
            name: user.name,
            profileColor: user.profileColor,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
}
