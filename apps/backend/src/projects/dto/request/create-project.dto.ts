import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsHexColor, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export enum ProjectPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export class CreateProjectDto {
    @ApiProperty({
        description: '프로젝트 이름',
        example: 'TaskFlow 개발 프로젝트',
        minLength: 2,
        maxLength: 100,
    })
    @IsString({ message: '프로젝트 이름은 문자열이어야 합니다' })
    @IsNotEmpty({ message: '프로젝트 이름은 필수입니다' })
    @Length(2, 100, { message: '프로젝트 이름은 2-100자 사이여야 합니다' })
    @Transform(({ value }) => value?.trim())
    readonly name: string;

    @ApiPropertyOptional({
        description: '프로젝트 설명',
        example: '태스크 관리를 위한 웹 애플리케이션 개발 프로젝트',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: '프로젝트 설명은 문자열이어야 합니다' })
    @Length(0, 500, { message: '프로젝트 설명은 500자 이하여야 합니다' })
    @Transform(({ value }) => value?.trim())
    readonly description?: string;

    @ApiPropertyOptional({
        description: '프로젝트 색상 (HEX 코드)',
        example: '#3B82F6',
        pattern: '^#[0-9A-Fa-f]{6}$',
    })
    @IsOptional()
    @IsHexColor({ message: '올바른 HEX 색상 코드를 입력하세요' })
    readonly color?: string = '#3B82F6';

    @ApiPropertyOptional({
        description: '프로젝트 우선순위',
        enum: ProjectPriority,
        example: ProjectPriority.MEDIUM,
        default: ProjectPriority.MEDIUM,
    })
    @IsOptional()
    @IsEnum(ProjectPriority, { message: '올바른 우선순위를 선택하세요' })
    readonly priority?: ProjectPriority = ProjectPriority.MEDIUM;

    @ApiPropertyOptional({
        description: '프로젝트 마감일',
        example: '2024-12-31T23:59:59Z',
        format: 'date-time',
    })
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : undefined)
    readonly dueDate?: Date;
}
