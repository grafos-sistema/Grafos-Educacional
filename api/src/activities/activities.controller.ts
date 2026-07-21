import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { AddQuestionDto } from './dto/add-question.dto';
import { UpdateActivityQuestionDto } from './dto/update-activity-question.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiResponse({
    status: 201,
    description: 'Activity created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subject, class, or academic period not found',
  })
  create(@Body() createActivityDto: CreateActivityDto, @CurrentUser() user: any) {
    return this.activitiesService.create(createActivityDto, user.userId);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get all activities with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of activities with pagination',
  })
  findAll(@Query() query: QueryActivityDto, @CurrentUser() user: any) {
    return this.activitiesService.findAll(query, user);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get a specific activity by ID' })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity details with all questions',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.activitiesService.findOne(id, user);
  }

  @Get(':id/preview')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Preview activity for printing' })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity preview formatted for display',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  preview(@Param('id') id: string, @CurrentUser() user: any) {
    return this.activitiesService.preview(id, user);
  }

  @Get(':id/answer-key')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get answer key for activity' })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Answer key with correct answers and explanations',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  getAnswerKey(@Param('id') id: string, @CurrentUser() user: any) {
    return this.activitiesService.getAnswerKey(id, user);
  }

  @Get(':id/pdf')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Generate PDF for activity' })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'PDF generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  async generatePdf(@Param('id') id: string, @CurrentUser() user: any) {
    const pdfBuffer = await this.activitiesService.generatePdf(id, user);
    return {
      data: pdfBuffer.toString('base64'),
      filename: `atividade-${id}.pdf`,
      mimeType: 'application/pdf',
    };
  }

  @Get(':id/html-preview')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Generate HTML preview for activity (same layout as PDF)' })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'HTML preview generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  async generateHtmlPreview(@Param('id') id: string, @CurrentUser() user: any) {
    const html = await this.activitiesService.generateHtmlPreview(id, user);
    return { html };
  }

  @Post(':id/questions')
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Add a question to an activity' })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Question added to activity successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity or question not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Question is already in this activity',
  })
  addQuestion(
    @Param('id') id: string,
    @Body() addQuestionDto: AddQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.activitiesService.addQuestion(id, addQuestionDto, user);
  }

  @Patch(':id/questions/:questionId')
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Update question in activity (reorder or change points)' })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: String,
  })
  @ApiParam({
    name: 'questionId',
    description: 'Question ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity question updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity or question not found',
  })
  updateActivityQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() updateDto: UpdateActivityQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.activitiesService.updateActivityQuestion(id, questionId, updateDto, user);
  }

  @Delete(':id/questions/:questionId')
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Remove a question from an activity' })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: String,
  })
  @ApiParam({
    name: 'questionId',
    description: 'Question ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Question removed from activity successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity or question not found',
  })
  removeQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: any,
  ) {
    return this.activitiesService.removeQuestion(id, questionId, user);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Update an activity' })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only edit your own activities',
  })
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
    @CurrentUser() user: any,
  ) {
    return this.activitiesService.update(id, updateActivityDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Delete an activity' })
  @ApiParam({
    name: 'id',
    description: 'Activity ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only delete your own activities',
  })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.activitiesService.remove(id, user);
  }
}
