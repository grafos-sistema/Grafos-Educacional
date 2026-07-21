import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';
import { GradesReportQueryDto } from './dto/grades-report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('attendance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get attendance report with statistics' })
  @ApiResponse({
    status: 200,
    description: 'Attendance report with summary and details by student',
  })
  getAttendanceReport(
    @Query() query: AttendanceReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getAttendanceReport(query, user);
  }

  @Get('grades')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get grades report with statistics' })
  @ApiResponse({
    status: 200,
    description: 'Grades report with summary, details by student and by subject',
  })
  getGradesReport(
    @Query() query: GradesReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getGradesReport(query, user);
  }

  @Get('student/:studentId/performance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get comprehensive performance report for a student' })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Student performance report including grades, attendance, and observations',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You do not have access to this student',
  })
  getStudentPerformance(
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getStudentPerformance(studentId, user);
  }

  @Get('class/:classId/performance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get performance report for a class' })
  @ApiParam({
    name: 'classId',
    description: 'Class ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Class performance report including average grades and attendance',
  })
  @ApiResponse({
    status: 404,
    description: 'Class not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You do not have access to this class',
  })
  getClassPerformance(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getClassPerformance(classId, user);
  }

  @Get('teacher/:teacherId/summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
  )
  @ApiOperation({ summary: 'Get summary report for a teacher' })
  @ApiParam({
    name: 'teacherId',
    description: 'Teacher ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher summary including classes taught and activity metrics',
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You do not have access to this teacher',
  })
  getTeacherSummary(
    @Param('teacherId') teacherId: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getTeacherSummary(teacherId, user);
  }
}
