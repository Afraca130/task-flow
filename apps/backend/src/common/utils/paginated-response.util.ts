export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export class PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;

    constructor(data: T[], meta: PaginationMeta) {
        this.data = data;
        this.meta = meta;
    }

    static create<T>(
        data: T[],
        pagination: { page: number; limit: number; total: number }
    ): PaginatedResponse<T> {
        const { page, limit, total } = pagination;
        const totalPages = Math.ceil(total / limit);

        return new PaginatedResponse(data, {
            page,
            limit,
            total,
            totalPages,
        });
    }
}
