import { DomainException } from '../exceptions/domain.exception';

/**
 * Project ID Value Object
 * Ensures project ID is valid UUID format
 */
export class ProjectId {
    private readonly value: string;

    constructor(value: string) {
        this.validateProjectId(value);
        this.value = value;
    }

    public getValue(): string {
        return this.value;
    }

    public equals(other: ProjectId): boolean {
        return this.value === other.value;
    }

    public toString(): string {
        return this.value;
    }

    private validateProjectId(value: string): void {
        if (!value || value.trim().length === 0) {
            throw new DomainException('Project ID cannot be empty');
        }

        // UUID v4 validation regex
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
            throw new DomainException('Project ID must be a valid UUID');
        }
    }

    public static create(value: string): ProjectId {
        return new ProjectId(value);
    }
}
