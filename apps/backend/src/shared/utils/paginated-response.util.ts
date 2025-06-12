import { ApiProperty } from '@nestjs/swagger';

export class PaginatedMeta {
    @ApiProperty({
        description: 'Current page number',
        example: 1,
        type: 'integer',
    })
    page: number;

    @ApiProperty({
        description: 'Number of items per page',
        example: 10,
        type: 'integer',
    })
    limit: number;

    @ApiProperty({
        description: 'Total number of items',
        example: 100,
        type: 'integer',
    })
    total: number;

    @ApiProperty({
        description: 'Total number of pages',
        example: 10,
        type: 'integer',
    })
    totalPages: number;

    @ApiProperty({
        description: 'Whether there are more pages',
        example: true,
    })
    hasNext: boolean;

    @ApiProperty({
        description: 'Whether there are previous pages',
        example: false,
    })
    hasPrev: boolean;
}

export class PaginatedResponse<T> {
    @ApiProperty({
        description: 'Array of data items',
        isArray: true,
    })
    data: T[];

    @ApiProperty({
        description: 'Pagination metadata',
        type: PaginatedMeta,
    })
    meta: PaginatedMeta;

    constructor(data: T[], meta: Partial<PaginatedMeta>) {
        this.data = data;
        this.meta = {
            page: meta.page || 1,
            limit: meta.limit || 10,
            total: meta.total || 0,
            totalPages: meta.totalPages || 0,
            hasNext: (meta.page || 1) < (meta.totalPages || 0),
            hasPrev: (meta.page || 1) > 1,
        };
    }

    static create<T>(
        data: T[],
        options: {
            page: number;
            limit: number;
            total: number;
        }
    ): PaginatedResponse<T> {
        const totalPages = Math.ceil(options.total / options.limit);

        return new PaginatedResponse(data, {
            page: options.page,
            limit: options.limit,
            total: options.total,
            totalPages,
            hasNext: options.page < totalPages,
            hasPrev: options.page > 1,
        });
    }
}
