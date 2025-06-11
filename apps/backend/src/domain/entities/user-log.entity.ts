import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum UserActionType {
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    REGISTER = 'REGISTER',
    PASSWORD_CHANGE = 'PASSWORD_CHANGE',
    PROFILE_UPDATE = 'PROFILE_UPDATE',
    PROJECT_CREATE = 'PROJECT_CREATE',
    PROJECT_JOIN = 'PROJECT_JOIN',
    PROJECT_LEAVE = 'PROJECT_LEAVE',
    TASK_CREATE = 'TASK_CREATE',
    TASK_UPDATE = 'TASK_UPDATE',
    TASK_DELETE = 'TASK_DELETE',
    TASK_COMPLETE = 'TASK_COMPLETE',
    COMMENT_CREATE = 'COMMENT_CREATE',
    COMMENT_UPDATE = 'COMMENT_UPDATE',
    COMMENT_DELETE = 'COMMENT_DELETE',
    FILE_UPLOAD = 'FILE_UPLOAD',
    FILE_DOWNLOAD = 'FILE_DOWNLOAD',
    NOTIFICATION_READ = 'NOTIFICATION_READ',
    SETTINGS_UPDATE = 'SETTINGS_UPDATE',
    API_ACCESS = 'API_ACCESS',
    SECURITY_EVENT = 'SECURITY_EVENT',
    ERROR_OCCURRED = 'ERROR_OCCURRED',
}

export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG',
}

/**
 * 사용자 활동 로그 엔티티
 */
@Entity('user_logs')
@Index(['userId', 'createdAt'])
@Index(['actionType', 'createdAt'])
@Index(['level', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
export class UserLog {
    @ApiProperty({
        description: '로그 고유 식별자',
        example: 'log-uuid-123',
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: '사용자 ID (로그인하지 않은 경우 null)',
        example: 'user-uuid-123',
        nullable: true,
    })
    @Column({ type: 'uuid', nullable: true })
    @Index()
    userId?: string;

    @ApiProperty({
        description: '세션 ID',
        example: 'session-uuid-123',
    })
    @Column({ type: 'varchar', length: 255, nullable: true })
    sessionId?: string;

    @ApiProperty({
        description: '사용자 활동 유형',
        enum: UserActionType,
        example: UserActionType.LOGIN,
    })
    @Column({
        type: 'enum',
        enum: UserActionType,
    })
    actionType: UserActionType;

    @ApiProperty({
        description: '로그 레벨',
        enum: LogLevel,
        example: LogLevel.INFO,
    })
    @Column({
        type: 'enum',
        enum: LogLevel,
        default: LogLevel.INFO,
    })
    level: LogLevel;

    @ApiProperty({
        description: '활동 설명',
        example: '사용자가 로그인했습니다',
    })
    @Column({ type: 'varchar', length: 500 })
    description: string;

    @ApiProperty({
        description: '상세 정보 (JSON 형태)',
        example: { previousValue: 'old', newValue: 'new' },
        nullable: true,
    })
    @Column({ type: 'jsonb', nullable: true })
    details?: Record<string, any>;

    @ApiProperty({
        description: '리소스 ID (작업 대상의 ID)',
        example: 'task-uuid-123',
        nullable: true,
    })
    @Column({ type: 'varchar', length: 255, nullable: true })
    resourceId?: string;

    @ApiProperty({
        description: '리소스 타입',
        example: 'task',
        nullable: true,
    })
    @Column({ type: 'varchar', length: 50, nullable: true })
    resourceType?: string;

    @ApiProperty({
        description: '사용자 IP 주소',
        example: '192.168.1.100',
    })
    @Column({ type: 'varchar', length: 45 })
    ipAddress: string;

    @ApiProperty({
        description: '사용자 에이전트 (브라우저 정보)',
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })
    @Column({ type: 'text', nullable: true })
    userAgent?: string;

    @ApiProperty({
        description: 'HTTP 메서드',
        example: 'POST',
        nullable: true,
    })
    @Column({ type: 'varchar', length: 10, nullable: true })
    method?: string;

    @ApiProperty({
        description: '요청 URL',
        example: '/api/v1/tasks',
        nullable: true,
    })
    @Column({ type: 'text', nullable: true })
    url?: string;

    @ApiProperty({
        description: 'HTTP 상태 코드',
        example: 200,
        nullable: true,
    })
    @Column({ type: 'integer', nullable: true })
    statusCode?: number;

    @ApiProperty({
        description: '응답 시간 (밀리초)',
        example: 150,
        nullable: true,
    })
    @Column({ type: 'integer', nullable: true })
    responseTime?: number;

    @ApiProperty({
        description: '에러 메시지',
        example: 'Validation failed',
        nullable: true,
    })
    @Column({ type: 'text', nullable: true })
    errorMessage?: string;

    @ApiProperty({
        description: '에러 스택 트레이스',
        nullable: true,
    })
    @Column({ type: 'text', nullable: true })
    errorStack?: string;

    @ApiProperty({
        description: '로그 생성 시간',
        example: '2023-12-01T10:00:00Z',
    })
    @CreateDateColumn()
    createdAt: Date;

    constructor(partial: Partial<UserLog>) {
        Object.assign(this, partial);
    }
}
