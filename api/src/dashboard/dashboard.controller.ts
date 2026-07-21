import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('coordinator')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Get coordinator dashboard with institution overview' })
  @ApiResponse({
    status: 200,
    description:
      'Dashboard data including totals, performance metrics, alerts, and recent activity',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  getCoordinatorDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getCoordinatorDashboard(user);
  }

  @Get('teacher')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Get teacher dashboard with classes and activities' })
  @ApiResponse({
    status: 200,
    description:
      'Dashboard data including classes taught, students, pending tasks, and recent content',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - teacher profile not found',
  })
  getTeacherDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getTeacherDashboard(user);
  }

  @Get('parent')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Get parent dashboard with children performance' })
  @ApiResponse({
    status: 200,
    description:
      "Dashboard data including children's grades, attendance, observations, and upcoming assignments",
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  getParentDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getParentDashboard(user);
  }

  @Get('statistics')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
  )
  @ApiOperation({ summary: 'Get general statistics' })
  @ApiResponse({
    status: 200,
    description: 'General statistics about users, institutions, questions, and activities',
  })
  getStatistics(@CurrentUser() user: any) {
    return this.dashboardService.getStatistics(user);
  }
}
