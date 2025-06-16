import { Injectable } from '@nestjs/common';

@Injectable()
export class CommentsService {
    findAll() {
        return 'This action returns all comments';
    }

    findOne(id: number) {
        return `This action returns a #${id} comment`;
    }

    create(createCommentDto: any) {
        return 'This action adds a new comment';
    }

    update(id: number, updateCommentDto: any) {
        return `This action updates a #${id} comment`;
    }

    remove(id: number) {
        return `This action removes a #${id} comment`;
    }
}
