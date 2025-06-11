import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetNotificationsQueryDto, MarkNotificationAsReadDto, MarkAllNotificationsAsReadDto } from '../dto/request/notification-query.dto';
import { 
  NotificationResponseDto, 
  NotificationSummaryResponseDto, 
  PaginatedNotificationResponseDto 
} from '../dto/response/notification-response.dto';
import { GetNotificationsUseCase } from '../../application/use-cases/notification/get-notifications.use-case';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/notification/mark-notification-as-read.use-case';
import { GetNotificationSummaryUseCase } from '../../application/use-cases/notification/get-notification-summary.use-case';

@ApiTags('notifications')
@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly getNotificationSummaryUseCase: GetNotificationSummaryUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: '알림 목록 조회',
    description: '사용자의 알림 목록을 페이지네이션과 필터링 옵션과 함께 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    description: '페이지 번호 (1부터 시작)',
    type: 'integer',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: '페이지당 아이템 수 (최대 100)',
    type: 'integer',
    example: 20,
    required: false,
  })
  @ApiQuery({
    name: 'isRead',
    description: '읽음 상태 필터',
    type: 'boolean',
    example: false,
    required: false,
  })
  @ApiQuery({
    name: 'type',
    description: '알림 유형 필터',
    enum: ['TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'COMMENT_ADDED', 'PROJECT_INVITED'],
    required: false,
  })
  @ApiQuery({
    name: 'priority',
    description: '알림 우선순위 필터',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    required: false,
  })
  @ApiQuery({
    name: 'search',
    description: '검색 키워드',
    type: 'string',
    required: false,
  })
  @ApiOkResponse({
    description: '알림 목록 조회 성공',
    type: PaginatedNotificationResponseDto,
  })
  async getNotifications(
    @Request() req: any,
    @Query() query: GetNotificationsQueryDto,
  ): Promise<PaginatedNotificationResponseDto> {
    const userId = req.user.id;
    
    return await this.getNotificationsUseCase.execute({
      userId,
      query,
    });
  }

  @Get('summary')
  @ApiOperation({
    summary: '알림 요약 정보 조회',
    description: '사용자의 알림 요약 정보(총 개수, 읽지 않은 개수, 우선순위별 개수 등)를 조회합니다.',
  })
  @ApiOkResponse({
    description: '알림 요약 정보 조회 성공',
    type: NotificationSummaryResponseDto,
  })
  async getNotificationSummary(
    @Request() req: any,
  ): Promise<NotificationSummaryResponseDto> {
    const userId = req.user.id;
    
    return await this.getNotificationSummaryUseCase.execute({ userId });
  }

  @Get('unread-count')
  @ApiOperation({
    summary: '읽지 않은 알림 개수 조회',
    description: '사용자의 읽지 않은 알림 개수를 조회합니다. (실시간 업데이트용)',
  })
  @ApiOkResponse({
    description: '읽지 않은 알림 개수 조회 성공',
    schema: {
      type: 'object',
      properties: {
        unreadCount: {
          type: 'integer',
          example: 5,
          description: '읽지 않은 알림 개수',
        },
      },
    },
  })
  async getUnreadCount(@Request() req: any): Promise<{ unreadCount: number }> {
    // 이 기능은 별도 Use Case로 분리할 수 있지만, 간단한 조회이므로 직접 구현
    // 실제 구현에서는 NotificationRepository를 직접 주입받아 사용
    return { unreadCount: 0 }; // 임시 구현
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: '알림 읽음 처리',
    description: '특정 알림을 읽음으로 표시합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '알림 ID',
    type: 'string',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: '알림 읽음 처리 성공',
    type: NotificationResponseDto,
  })
  async markAsRead(
    @Request() req: any,
    @Param('id') notificationId: string,
  ): Promise<NotificationResponseDto> {
    const userId = req.user.id;
    
    return await this.markNotificationAsReadUseCase.execute({
      userId,
      notificationId,
    });
  }

  @Patch('mark-all-read')
  @ApiOperation({
    summary: '모든 알림 읽음 처리',
    description: '사용자의 모든 읽지 않은 알림을 읽음으로 표시합니다. 특정 유형만 선택적으로 처리할 수 있습니다.',
  })
  @ApiOkResponse({
    description: '모든 알림 읽음 처리 성공',
    schema: {
      type: 'object',
      properties: {
        markedCount: {
          type: 'integer',
          example: 12,
          description: '읽음 처리된 알림 개수',
        },
      },
    },
  })
  async markAllAsRead(
    @Request() req: any,
    @Body() body: MarkAllNotificationsAsReadDto,
  ): Promise<{ markedCount: number }> {
    // 이 기능도 별도 Use Case로 분리 가능
    return { markedCount: 0 }; // 임시 구현
  }

  @Delete(':id')
  @ApiOperation({
    summary: '알림 삭제',
    description: '특정 알림을 삭제합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '알림 ID',
    type: 'string',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: '알림 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })

  async deleteNotification(
    @Request() req: any,
    @Param('id') notificationId: string,
  ): Promise<{ success: boolean }> {
    // 삭제 Use Case 구현 필요
    return { success: true }; // 임시 구현
  }

  @Get('recent')
  @ApiOperation({
    summary: '최근 알림 조회',
    description: '사용자의 최근 알림을 조회합니다. (실시간 알림 표시용)',
  })
  @ApiQuery({
    name: 'limit',
    description: '조회할 알림 개수',
    type: 'integer',
    example: 5,
    required: false,
  })
  @ApiOkResponse({
    description: '최근 알림 조회 성공',
    type: [NotificationResponseDto],
  })
  async getRecentNotifications(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<NotificationResponseDto[]> {
    // 최근 알림 조회 Use Case 구현 필요
    return []; // 임시 구현
  }
} 