import { CreateProjectDto, ProjectPriority } from '../../presentation/dto/request/create-project.dto';

/**
 * Create Project Command
 * Encapsulates all data needed to create a project
 */
export class CreateProjectCommand {
    constructor(
        public readonly name: string,
        public readonly description: string | undefined,
        public readonly color: string,
        public readonly iconUrl: string | undefined,
        public readonly priority: ProjectPriority,
        public readonly dueDate: Date | undefined,
        public readonly userId: string,
    ) { }

    public static fromDto(dto: CreateProjectDto, userId: string): CreateProjectCommand {
        return new CreateProjectCommand(
            dto.name,
            dto.description,
            dto.color || '#3B82F6',
            dto.iconUrl,
            dto.priority || ProjectPriority.MEDIUM,
            dto.dueDate,
            userId,
        );
    }
}
