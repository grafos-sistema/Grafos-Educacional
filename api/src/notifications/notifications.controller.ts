import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { NotificationType } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Listar notificações do usuário autenticado',
    description: 'Retorna todas as notificações do usuário com paginação',
  })
  @ApiQuery({ name: 'read', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista de notificações' })
  findMyNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Query('read') read?: string,
    @Query('type') type?: NotificationType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const offset = (page - 1) * limit;
    const readBoolean =
      read === 'true' ? true : read === 'false' ? false : undefined;

    return this.notificationsService.findByUser(
      user.userId,
      readBoolean,
      type,
      limit,
      offset,
    );
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Contar notificações não lidas',
    description: 'Retorna o número de notificações não lidas do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Contador de não lidas',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
      },
    },
  })
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    const count = await this.notificationsService.getUnreadCount(user.userId);
    return { count };
  }

  @Get('pending-approvals-count')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({
    summary: 'Contar aprovações pendentes',
    description: 'Retorna o número de usuários pendentes de aprovação (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Contador de pendentes',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 3 },
      },
    },
  })
  async getPendingApprovalsCount(@CurrentUser() user: CurrentUserPayload) {
    const count =
      await this.notificationsService.getPendingApprovalsCount(
        user.institutionId,
      );
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar notificação como lida',
    description: 'Marca uma notificação específica como lida',
  })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.notificationsService.markAsRead(id, user.userId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar todas como lidas',
    description: 'Marca todas as notificações do usuário como lidas',
  })
  @ApiResponse({
    status: 200,
    description: 'Todas as notificações marcadas como lidas',
  })
  markAllAsRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar notificação',
    description: 'Remove uma notificação do usuário',
  })
  @ApiResponse({ status: 200, description: 'Notificação deletada' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.remove(id, user.userId);
  }
}
