import { Injectable } from '@nestjs/common';

@Injectable()
export class ProjectsService {
    findAll() {
        return 'This action returns all projects';
    }

    findOne(id: number) {
        return `This action returns a #${id} project`;
    }

    create(createProjectDto: any) {
        return 'This action adds a new project';
    }

    update(id: number, updateProjectDto: any) {
        return `This action updates a #${id} project`;
    }

    remove(id: number) {
        return `This action removes a #${id} project`;
    }
}
