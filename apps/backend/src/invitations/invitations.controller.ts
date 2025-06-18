import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  ApiAcceptInvitation,
  ApiCreateInvitation,
  ApiDeclineInvitation,
  ApiDeleteInvitation,
  ApiGetInvitation,
  ApiGetProjectInvitations,
  ApiGetReceivedInvitations,
} from '../swagger/decorators/api-invitation-responses.decorator';
import { CreateInvitationDto } from './dto/request/create-invitation.dto';
import { InvitationStatus } from './entities/project-invitation.entity';
import {
  AcceptInvitationCommand,
  CreateInvitationCommand,
  DeclineInvitationCommand,
} from './interfaces/invitation-commands.interface';
import {
  InvitationFilter,
  InvitationPaginationOptions,
} from './interfaces/invitation.interface';
import { InvitationsService } from './invitations.service';

@ApiTags('invitations')
@Controller('invitations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiCreateInvitation(CreateInvitationDto)
  async createInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
    @Req() req: Request,
  ) {
    const command: CreateInvitationCommand = {
      projectId: createInvitationDto.projectId,
      inviterId: (req as any).user?.id,
      inviteeId: createInvitationDto.inviteeId,
      message: createInvitationDto.message,
    };

    return this.invitationsService.createInvitation(
      createInvitationDto,
      command.inviterId,
    );
  }

  @Post(':token/accept')
  @ApiAcceptInvitation()
  async acceptInvitation(@Param('token') token: string, @Req() req: Request) {
    const command: AcceptInvitationCommand = {
      token,
      userId: (req as any).user?.id,
    };

    return this.invitationsService.acceptInvitation(token, command.userId);
  }

  @Post(':token/decline')
  @ApiDeclineInvitation()
  async declineInvitation(@Param('token') token: string, @Req() req: Request) {
    const command: DeclineInvitationCommand = {
      token,
      userId: (req as any).user?.id,
    };

    return this.invitationsService.declineInvitation(token, command.userId);
  }

  @Get(':token')
  @ApiGetInvitation()
  async getInvitationByToken(@Param('token') token: string) {
    return this.invitationsService.getInvitationByToken(token);
  }

  @Get('project/:projectId')
  @ApiGetProjectInvitations()
  async getProjectInvitations(@Param('projectId') projectId: string) {
    return this.invitationsService.getProjectInvitations(projectId);
  }

  @Get('user/received')
  @ApiGetReceivedInvitations()
  async getReceivedInvitations(
    @Req() req: Request,
    @Query('status') status?: InvitationStatus,
  ) {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    if (status) {
      const filter: InvitationFilter = {
        status,
      };
      const options: InvitationPaginationOptions = {
        page: 1,
        limit: 100,
      };

      // 사용자 ID 또는 이메일로 검색
      const invitationsById = await this.invitationsService.findMany(
        { ...filter, inviteeId: userId },
        options,
      );

      // 중복 제거하여 합치기
      const allInvitations = [...invitationsById.data];

      return allInvitations;
    }

    // 모든 초대 조회
    const invitationsById =
      await this.invitationsService.findByInviteeId(userId);

    // 중복 제거하여 합치기
    const allInvitations = [...invitationsById];

    return allInvitations;
  }

  @Get('user/pending')
  @ApiGetReceivedInvitations()
  async getPendingInvitations(@Req() req: Request) {
    const userId = (req as any).user?.id;
    return this.invitationsService.findPendingInvitations(userId);
  }

  @Delete(':id')
  @ApiDeleteInvitation()
  async deleteInvitation(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id;

    // 초대 조회 및 권한 확인
    const invitation = await this.invitationsService.findById(id);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.inviterId !== userId) {
      throw new Error('You can only delete invitations you sent');
    }

    await this.invitationsService.delete(id);
    return { message: 'Invitation deleted successfully' };
  }
}
