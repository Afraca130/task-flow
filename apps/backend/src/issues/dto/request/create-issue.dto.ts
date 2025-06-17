import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { IssuePriority, IssueType } from '../../entities/issue.entity';

export class CreateIssueDto {
    @ApiProperty({
        description: 'Issue title',
        example: 'Bug in user authentication',
        maxLength: 200,
    })
    @IsString()
    @IsNotEmpty()
    readonly title: string;

    @ApiProperty({
        description: 'Issue description',
        example: 'Users are unable to login with their credentials',
    })
    @IsString()
    @IsNotEmpty()
    readonly description: string;

    @ApiProperty({
        description: 'Project ID',
        example: 'uuid-string',
        format: 'uuid',
    })
    @IsUUID()
    @IsNotEmpty()
    readonly projectId: string;

    @ApiPropertyOptional({
        description: 'Assignee user ID',
        example: 'uuid-string',
        format: 'uuid',
    })
    @IsUUID()
    @IsOptional()
    readonly assigneeId?: string;

    @ApiPropertyOptional({
        description: 'Issue priority',
        enum: IssuePriority,
        example: IssuePriority.MEDIUM,
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
        description: 'Issue labels',
        example: ['frontend', 'urgent'],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    readonly labels?: string[];
}
