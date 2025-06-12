import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateCommentUseCase } from '../../application/use-cases/comment/create-comment.use-case';
import { DeleteCommentUseCase } from '../../application/use-cases/comment/delete-comment.use-case';
import { GetTaskCommentsUseCase } from '../../application/use-cases/comment/get-task-comments.use-case';
import { UpdateCommentUseCase } from '../../application/use-cases/comment/update-comment.use-case';
import { Comment } from '../../domain/entities/comment.entity';
import { Task } from '../../domain/entities/task.entity';
import { User } from '../../domain/entities/user.entity';
import { CommentController } from '../controllers/comment.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Comment, Task, User]),
    ],
    controllers: [CommentController],
    providers: [
        CreateCommentUseCase,
        GetTaskCommentsUseCase,
        UpdateCommentUseCase,
        DeleteCommentUseCase,
    ],
    exports: [
        CreateCommentUseCase,
        GetTaskCommentsUseCase,
        UpdateCommentUseCase,
        DeleteCommentUseCase,
    ],
})
export class CommentModule { }
