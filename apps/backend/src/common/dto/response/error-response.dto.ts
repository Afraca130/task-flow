import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
    @ApiProperty({
        description: 'HTTP status code',
        example: 400,
        type: 'integer',
    })
    readonly statusCode: number;

    @ApiProperty({
        description: 'Error message',
        example: 'Validation failed',
    })
    readonly message: string;

    @ApiPropertyOptional({
        description: 'Detailed error information',
        example: ['title must be a non-empty string'],
        type: [String],
    })
    readonly details?: string[];

    @ApiProperty({
        description: 'Timestamp when error occurred',
        example: '2023-12-01T10:00:00Z',
        format: 'date-time',
    })
    readonly timestamp: string;

    @ApiProperty({
        description: 'Request path that caused the error',
        example: '/api/tasks',
    })
    readonly path: string;

    constructor(partial: Partial<ErrorResponseDto>) {
        Object.assign(this, partial);
    }
}
