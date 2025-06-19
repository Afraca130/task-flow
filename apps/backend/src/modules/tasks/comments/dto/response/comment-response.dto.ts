import { ApiProperty } from '@nestjs/swagger';
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

    @ApiProperty({
        description: 'User who created the comment',
        type: UserResponseDto,
    })
    @Expose()
    @Type(() => UserResponseDto)
    readonly user?: UserResponseDto;

    constructor(partial: Partial<CommentResponseDto>) {
        Object.assign(this, partial);
    }

    static fromDomain(comment: Comment): CommentResponseDto {
        return new CommentResponseDto({
            id: comment.id,
            content: comment.content,
            taskId: comment.taskId,
            userId: comment.userId,
            isDeleted: comment.isDeleted,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: comment.user ? UserResponseDto.fromDomain(comment.user) : undefined,
        });
    }
}
