import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { IssueType } from '../../entities/issue.entity';

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
        description: 'Issue type',
        enum: IssueType,
        example: IssueType.BUG,
    })
    @IsEnum(IssueType)
    @IsOptional()
    readonly type?: IssueType;
}
