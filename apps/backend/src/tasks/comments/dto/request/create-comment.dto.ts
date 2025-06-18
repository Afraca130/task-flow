import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
    @ApiProperty({
        description: 'Task ID to comment on',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsUUID(4, { message: 'Task ID must be a valid UUID' })
    @IsNotEmpty({ message: 'Task ID is required' })
    readonly taskId: string;

    @ApiProperty({
        description: 'Comment content',
        example: 'This is a comment on the task',
        maxLength: 2000,
    })
    @IsString({ message: 'Content must be a string' })
    @IsNotEmpty({ message: 'Content is required' })
    @MaxLength(2000, { message: 'Content must not exceed 2000 characters' })
    readonly content: string;

    @ApiPropertyOptional({
        description: 'Parent comment ID for replies',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID(4, { message: 'Parent ID must be a valid UUID' })
    readonly parentId?: string;
}
