import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateInvitationDto {
    @ApiProperty({
        description: '초대할 프로젝트의 ID',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsNotEmpty({ message: '프로젝트 ID는 필수입니다' })
    @IsUUID(4, { message: '프로젝트 ID는 유효한 UUID여야 합니다' })
    readonly projectId: string;

    @ApiPropertyOptional({
        description: '초대받을 사용자의 ID (이메일 또는 사용자 ID 중 하나는 필수)',
        example: 'uuid-v4-string',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID(4, { message: '사용자 ID는 유효한 UUID여야 합니다' })
    readonly inviteeId?: string;

    @ApiPropertyOptional({
        description: '초대 메시지',
        example: '프로젝트에 참여해주세요! 함께 멋진 결과를 만들어봐요.',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: '메시지는 문자열이어야 합니다' })
    @Transform(({ value }) => value?.trim())
    readonly message?: string;

    @ApiPropertyOptional({
        description: '초대 만료 기간 (일 단위)',
        example: 7,
        minimum: 1,
        maximum: 30,
        default: 7,
    })
    @IsOptional()
    @IsInt({ message: '만료 기간은 정수여야 합니다' })
    @Min(1, { message: '만료 기간은 최소 1일입니다' })
    @Max(30, { message: '만료 기간은 최대 30일입니다' })
    readonly expiryDays?: number = 7;
}
