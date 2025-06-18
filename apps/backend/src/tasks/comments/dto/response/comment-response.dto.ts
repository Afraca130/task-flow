import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../../../users/dto/response/user-response.dto';
import { Comment } from '../../entities/comment.entity';


@Exclude()
export class CommentResponseDto {
    @ApiProperty({
        description: 'Comment unique identifier',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly id: string;

    @ApiProperty({
        description: 'Comment content',
        example: 'This is a comment on the task',
    })
    @Expose()
    readonly content: string;

    @ApiProperty({
        description: 'Task ID this comment belongs to',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly taskId: string;

    @ApiProperty({
        description: 'User ID who created the comment',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly userId: string;

    @ApiPropertyOptional({
        description: 'Parent comment ID for replies',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @Expose()
    readonly parentId?: string;

    @ApiProperty({
        description: 'Whether the comment is deleted',
        example: false,
    })
    @Expose()
    readonly isDeleted: boolean;

    @ApiProperty({
        description: 'Comment creation timestamp',
        example: '2023-12-01T10:00:00Z',
        format: 'date-time',
    })
    @Expose()
    readonly createdAt: Date;

    @ApiProperty({
        description: 'Comment last update timestamp',
        example: '2023-12-01T10:00:00Z',
        format: 'date-time',
    })
    @Expose()
    readonly updatedAt: Date;

    @ApiPropertyOptional({
        description: 'User who created the comment',
        type: UserResponseDto,
    })
    @Expose()
    @Type(() => UserResponseDto)
    readonly user?: UserResponseDto;

    @ApiPropertyOptional({
        description: 'Parent comment (for replies)',
        type: CommentResponseDto,
    })
    @Expose()
    @Type(() => CommentResponseDto)
    readonly parent?: CommentResponseDto;

    @ApiPropertyOptional({
        description: 'Replies to this comment',
        type: [CommentResponseDto],
    })
    @Expose()
    @Type(() => CommentResponseDto)
    readonly replies?: CommentResponseDto[];

    constructor(partial: Partial<CommentResponseDto>) {
        Object.assign(this, partial);
    }

    static fromDomain(comment: Comment): CommentResponseDto {
        return new CommentResponseDto({
            id: comment.id,
            content: comment.content,
            taskId: comment.taskId,
            userId: comment.userId,
            parentId: comment.parentId,
            isDeleted: comment.isDeleted,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: comment.user ? UserResponseDto.fromDomain(comment.user) : undefined,
            parent: comment.parent ? CommentResponseDto.fromDomain(comment.parent) : undefined,
            replies: comment.replies ? comment.replies.map(reply => CommentResponseDto.fromDomain(reply)) : undefined,
        });
    }
}
