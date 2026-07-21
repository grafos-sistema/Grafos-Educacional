import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RankingsService } from './rankings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, RankingPeriod } from '@prisma/client';

@ApiTags('rankings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get('class/:classId')
  @ApiOperation({ summary: 'Obter ranking de uma turma' })
  @ApiQuery({ name: 'period', enum: RankingPeriod, required: false })
  @ApiQuery({ name: 'limit', required: false })
  getClassRanking(
    @Param('classId') classId: string,
    @Query('period') period?: RankingPeriod,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.rankingsService.getClassRanking(
      classId,
      period || RankingPeriod.MONTHLY,
      limit,
    );
  }

  @Get('institution/:institutionId')
  @ApiOperation({ summary: 'Obter ranking geral da instituição' })
  @ApiQuery({ name: 'period', enum: RankingPeriod, required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  getInstitutionRanking(
    @Param('institutionId') institutionId: string,
    @Query('period') period?: RankingPeriod,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.rankingsService.getInstitutionRanking(
      institutionId,
      period || RankingPeriod.MONTHLY,
      limit,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obter ranking de um usuário específico' })
  @ApiQuery({ name: 'period', enum: RankingPeriod, required: false })
  getUserRanking(
    @Param('userId') userId: string,
    @Query('period') period?: RankingPeriod,
  ) {
    return this.rankingsService.getUserRanking(
      userId,
      period || RankingPeriod.MONTHLY,
    );
  }

  @Get('user/:userId/history')
  @ApiOperation({ summary: 'Obter histórico de ranking de um usuário' })
  @ApiQuery({ name: 'limit', required: false })
  getUserRankingHistory(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit = 12,
  ) {
    return this.rankingsService.getUserRankingHistory(userId, limit);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter meu ranking' })
  @ApiQuery({ name: 'period', enum: RankingPeriod, required: false })
  getMyRanking(
    @CurrentUser() user: any,
    @Query('period') period?: RankingPeriod,
  ) {
    return this.rankingsService.getUserRanking(
      user.userId,
      period || RankingPeriod.MONTHLY,
    );
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Obter meu histórico de ranking' })
  @ApiQuery({ name: 'limit', required: false })
  getMyRankingHistory(
    @CurrentUser() user: any,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit = 12,
  ) {
    return this.rankingsService.getUserRankingHistory(user.userId, limit);
  }

  @Post('recalculate')
  @ApiOperation({
    summary: 'Recalcular todos os rankings',
    description: 'Recalcula os rankings de todos os alunos (Admin only)',
  })
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  recalculateAll() {
    return this.rankingsService.recalculateAllRankings();
  }

  @Post('user/:userId/update')
  @ApiOperation({
    summary: 'Atualizar ranking de um usuário específico',
  })
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.TEACHER)
  updateUserRanking(@Param('userId') userId: string) {
    return this.rankingsService.updateUserRanking(userId);
  }
}
