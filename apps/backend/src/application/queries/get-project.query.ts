/**
 * Get Project Query
 * Encapsulates data needed to retrieve a single project
 */
export class GetProjectQuery {
    constructor(
        public readonly projectId: string,
        public readonly userId: string,
    ) { }
}

/**
 * Get Projects Query
 * Encapsulates data needed to retrieve multiple projects
 */
export class GetProjectsQuery {
    constructor(
        public readonly userId: string,
        public readonly options: {
            page?: number;
            limit?: number;
            search?: string;
            isActive?: boolean;
        } = {},
    ) { }
}
