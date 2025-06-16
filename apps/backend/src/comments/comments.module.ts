import { TasksModule } from '@/tasks/tasks.module';
import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CreateCommentUseCase } from './create-comment.use-case';
import { DeleteCommentUseCase } from './delete-comment.use-case';
import { Comment } from './entities/comment.entity';
import { GetTaskCommentsUseCase } from './get-task-comments.use-case';
import { UpdateCommentUseCase } from './update-comment.use-case';

@Module({
    imports: [TypeOrmModule.forFeature([Comment]), TasksModule, UsersModule],
    controllers: [CommentController],
    providers: [CommentsService, CreateCommentUseCase, DeleteCommentUseCase, UpdateCommentUseCase, GetTaskCommentsUseCase],
    exports: [CommentsService],
})
export class CommentsModule { }
