import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('achievements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('badges')
  @ApiOperation({ summary: 'Listar todos os badges disponíveis' })
  getAllBadges() {
    return this.achievementsService.getAllBadges();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Listar conquistas de um usuário' })
  getUserAchievements(@Param('userId') userId: string) {
    return this.achievementsService.getUserAchievements(userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Listar minhas conquistas' })
  getMyAchievements(@CurrentUser() user: any) {
    return this.achievementsService.getUserAchievements(user.userId);
  }

  @Post('user/:userId/check')
  @ApiOperation({
    summary: 'Verificar e desbloquear badges automaticamente',
  })
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.TEACHER)
  checkAndUnlockBadges(@Param('userId') userId: string) {
    return this.achievementsService.checkAndUnlockBadges(userId);
  }

  @Post('badges/seed')
  @ApiOperation({
    summary: 'Criar badges iniciais',
    description: 'Seed de badges padrão (Admin only)',
  })
  @Roles(UserRole.SUPER_ADMIN)
  seedBadges() {
    return this.achievementsService.seedBadges();
  }
}
