/**
 * Base Domain Exception
 * Used for business rule violations in the domain layer
 */
export class DomainException extends Error {
    constructor(
        message: string,
        public readonly code?: string,
    ) {
        super(message);
        this.name = 'DomainException';
        Object.setPrototypeOf(this, DomainException.prototype);
    }
}

/**
 * Project specific domain exceptions
 */
export class ProjectNotFoundException extends DomainException {
    constructor(projectId: string) {
        super(`Project with ID ${projectId} not found`, 'PROJECT_NOT_FOUND');
        this.name = 'ProjectNotFoundException';
    }
}

export class ProjectAlreadyExistsException extends DomainException {
    constructor(projectName: string) {
        super(`Project with name "${projectName}" already exists`, 'PROJECT_ALREADY_EXISTS');
        this.name = 'ProjectAlreadyExistsException';
    }
}

export class ProjectUnauthorizedException extends DomainException {
    constructor(projectId: string, userId: string) {
        super(`User ${userId} is not authorized to access project ${projectId}`, 'PROJECT_UNAUTHORIZED');
        this.name = 'ProjectUnauthorizedException';
    }
}
