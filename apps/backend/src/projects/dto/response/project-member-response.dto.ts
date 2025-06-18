import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export enum ProjectMemberRole {
    OWNER = 'OWNER',
    MANAGER = 'MANAGER',
    MEMBER = 'MEMBER',
}

@Exclude()
export class ProjectMemberUserDto {
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

    constructor(partial: Partial<ProjectMemberUserDto>) {
        Object.assign(this, partial);
    }
}

@Exclude()
export class ProjectMemberResponseDto {
    @ApiProperty({
        description: 'Project member unique identifier',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly id: string;

    @ApiProperty({
        description: 'Project unique identifier',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly projectId: string;

    @ApiProperty({
        description: 'User unique identifier',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly userId: string;

    @ApiProperty({
        description: 'Member role in the project',
        enum: ProjectMemberRole,
        example: ProjectMemberRole.MEMBER,
    })
    @Expose()
    readonly role: ProjectMemberRole;

    @ApiPropertyOptional({
        description: 'Date when member joined the project',
        example: '2023-12-01T10:00:00Z',
        format: 'date-time',
    })
    @Expose()
    readonly joinedAt?: string;

    @ApiPropertyOptional({
        description: 'User ID who invited this member',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly invitedBy?: string;

    @ApiProperty({
        description: 'Whether the member is active',
        example: true,
    })
    @Expose()
    readonly isActive: boolean;

    @ApiProperty({
        description: 'Member creation timestamp',
        example: '2023-12-01T10:00:00Z',
        format: 'date-time',
    })
    @Expose()
    readonly createdAt: string;

    @ApiPropertyOptional({
        description: 'User information',
        type: ProjectMemberUserDto,
    })
    @Expose()
    readonly user?: ProjectMemberUserDto;

    @ApiPropertyOptional({
        description: 'Inviter user information',
        type: ProjectMemberUserDto,
    })
    @Expose()
    readonly inviter?: ProjectMemberUserDto;

    constructor(partial: Partial<ProjectMemberResponseDto>) {
        Object.assign(this, partial);
    }

    static fromEntity(entity: any): ProjectMemberResponseDto {
        return new ProjectMemberResponseDto({
            id: entity.id,
            projectId: entity.projectId,
            userId: entity.userId,
            role: entity.role,
            joinedAt: entity.joinedAt?.toISOString(),
            invitedBy: entity.invitedBy,
            isActive: entity.isActive,
            createdAt: entity.createdAt?.toISOString(),
            user: entity.user ? new ProjectMemberUserDto({
                id: entity.user.id,
                email: entity.user.email,
                name: entity.user.name,
            }) : undefined,
            inviter: entity.inviter ? new ProjectMemberUserDto({
                id: entity.inviter.id,
                email: entity.inviter.email,
                name: entity.inviter.name,
            }) : undefined,
        });
    }
}
