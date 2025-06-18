import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

import { Project, ProjectStatus } from '../../entities/project.entity';
import { ProjectPriority } from '../request/create-project.dto';

@Exclude()
export class ProjectResponseDto {
    @ApiProperty({
        description: '프로젝트 고유 식별자',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly id: string;

    @ApiProperty({
        description: '프로젝트 이름',
        example: 'TaskFlow 개발 프로젝트',
    })
    @Expose()
    readonly name: string;

    @ApiPropertyOptional({
        description: '프로젝트 설명',
        example: '태스크 관리를 위한 웹 애플리케이션 개발 프로젝트',
    })
    @Expose()
    readonly description?: string;

    @ApiProperty({
        description: '프로젝트 색상 (HEX 코드)',
        example: '#3B82F6',
        pattern: '^#[0-9A-Fa-f]{6}$',
    })
    @Expose()
    readonly color: string;

    @ApiPropertyOptional({
        description: '프로젝트 아이콘 URL',
        example: 'https://example.com/icon.png',
        format: 'uri',
    })
    @Expose()
    readonly iconUrl?: string;

    @ApiProperty({
        description: '프로젝트 우선순위',
        enum: ProjectPriority,
        example: ProjectPriority.MEDIUM,
    })
    @Expose()
    readonly priority: ProjectPriority;

    @ApiPropertyOptional({
        description: '프로젝트 마감일',
        example: '2024-12-31T23:59:59Z',
        format: 'date-time',
    })
    @Expose()
    readonly dueDate?: Date;

    @ApiProperty({
        description: '프로젝트 활성 상태',
        example: true,
    })
    @Expose()
    readonly isActive: boolean;

    @ApiProperty({
        description: '프로젝트 소유자 ID',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly ownerId: string;

    @ApiProperty({
        description: '프로젝트 생성 일시',
        example: '2023-12-01T10:00:00Z',
        format: 'date-time',
    })
    @Expose()
    readonly createdAt: Date;

    @ApiProperty({
        description: '프로젝트 마지막 수정 일시',
        example: '2023-12-01T10:00:00Z',
        format: 'date-time',
    })
    @Expose()
    readonly updatedAt: Date;

    @ApiPropertyOptional({
        description: '프로젝트 멤버 수',
        example: 5,
        type: 'integer',
    })
    @Expose()
    readonly memberCount?: number;

    @ApiPropertyOptional({
        description: '프로젝트 태스크 수',
        example: 15,
        type: 'integer',
    })
    @Expose()
    readonly taskCount?: number;

    constructor(partial: Partial<ProjectResponseDto>) {
        Object.assign(this, partial);
    }

    static fromDomain(project: Project): ProjectResponseDto {
        return new ProjectResponseDto({
            id: project.id,
            name: project.name,
            description: project.description,
            color: project.color,
            iconUrl: project.iconUrl,
            priority: project.priority,
            dueDate: project.endDate,
            isActive: project.status === ProjectStatus.ACTIVE,
            ownerId: project.ownerId,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            memberCount: project.members?.length || 0,
            taskCount: project.tasks?.length || 0,
        });
    }

}
