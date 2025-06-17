import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { IssuePriority, IssueStatus, IssueType } from '../../entities/issue.entity';

export class UpdateIssueDto {
    @ApiPropertyOptional({
        description: 'Issue title',
        example: 'Updated bug in user authentication',
        maxLength: 200,
    })
    @IsString()
    @IsOptional()
    readonly title?: string;

    @ApiPropertyOptional({
        description: 'Issue description',
        example: 'Updated description of the authentication bug',
    })
    @IsString()
    @IsOptional()
    readonly description?: string;

    @ApiPropertyOptional({
        description: 'Issue status',
        enum: IssueStatus,
        example: IssueStatus.IN_PROGRESS,
    })
    @IsEnum(IssueStatus)
    @IsOptional()
    readonly status?: IssueStatus;

    @ApiPropertyOptional({
        description: 'Issue priority',
        enum: IssuePriority,
        example: IssuePriority.HIGH,
    })
    @IsEnum(IssuePriority)
    @IsOptional()
    readonly priority?: IssuePriority;

    @ApiPropertyOptional({
        description: 'Issue type',
        enum: IssueType,
        example: IssueType.BUG,
    })
    @IsEnum(IssueType)
    @IsOptional()
    readonly type?: IssueType;

    @ApiPropertyOptional({
        description: 'Assignee user ID',
        example: 'uuid-string',
        format: 'uuid',
    })
    @IsUUID()
    @IsOptional()
    readonly assigneeId?: string;

    @ApiPropertyOptional({
        description: 'Issue labels',
        example: ['frontend', 'critical'],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    readonly labels?: string[];
}
