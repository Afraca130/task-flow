import { DomainException } from '../exceptions/domain.exception';

/**
 * Project Name Value Object
 * Ensures project name meets business rules
 */
export class ProjectName {
    private readonly value: string;
    private static readonly MIN_LENGTH = 1;
    private static readonly MAX_LENGTH = 255;

    constructor(value: string) {
        this.validateProjectName(value);
        this.value = value.trim();
    }

    public getValue(): string {
        return this.value;
    }

    public equals(other: ProjectName): boolean {
        return this.value === other.value;
    }

    public toString(): string {
        return this.value;
    }

    private validateProjectName(value: string): void {
        if (!value || typeof value !== 'string') {
            throw new DomainException('Project name is required');
        }

        const trimmedValue = value.trim();

        if (trimmedValue.length < ProjectName.MIN_LENGTH) {
            throw new DomainException('Project name cannot be empty');
        }

        if (trimmedValue.length > ProjectName.MAX_LENGTH) {
            throw new DomainException(`Project name cannot exceed ${ProjectName.MAX_LENGTH} characters`);
        }

        // Check for invalid characters
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(trimmedValue)) {
            throw new DomainException('Project name contains invalid characters');
        }
    }

    public static create(value: string): ProjectName {
        return new ProjectName(value);
    }
}
