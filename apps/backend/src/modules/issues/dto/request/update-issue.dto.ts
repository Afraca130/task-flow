import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IssueType } from '../../entities/issue.entity';

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
        description: 'Issue type',
        enum: IssueType,
        example: IssueType.BUG,
    })
    @IsEnum(IssueType)
    @IsOptional()
    readonly type?: IssueType;
}
