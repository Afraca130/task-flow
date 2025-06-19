import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
    @ApiProperty({
        description: 'Updated comment content',
        example: 'This is an updated comment',
        maxLength: 2000,
    })
    @IsString({ message: 'Content must be a string' })
    @IsNotEmpty({ message: 'Content is required' })
    @MaxLength(2000, { message: 'Content must not exceed 2000 characters' })
    readonly content: string;
}
