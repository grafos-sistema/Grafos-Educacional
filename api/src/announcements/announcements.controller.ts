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
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { QueryAnnouncementDto } from './dto/query-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Create a new announcement' })
  @ApiResponse({
    status: 201,
    description: 'Announcement created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Institution or class not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid dates or data',
  })
  create(@Body() createAnnouncementDto: CreateAnnouncementDto, @CurrentUser() user: any) {
    return this.announcementsService.create(createAnnouncementDto, user.userId);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get all announcements with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of announcements with pagination',
  })
  findAll(@Query() query: QueryAnnouncementDto, @CurrentUser() user: any) {
    return this.announcementsService.findAll(query, user);
  }

  @Get('active')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get active announcements for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of active announcements',
  })
  findActiveForUser(@CurrentUser() user: any) {
    return this.announcementsService.findActiveForUser(user);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get a specific announcement by ID' })
  @ApiParam({
    name: 'id',
    description: 'Announcement ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Announcement details',
  })
  @ApiResponse({
    status: 404,
    description: 'Announcement not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You do not have access to this announcement',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.announcementsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update an announcement' })
  @ApiParam({
    name: 'id',
    description: 'Announcement ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Announcement updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Announcement not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You do not have permission to edit this announcement',
  })
  update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
    @CurrentUser() user: any,
  ) {
    return this.announcementsService.update(id, updateAnnouncementDto, user);
  }

  @Patch(':id/publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Publish an announcement' })
  @ApiParam({
    name: 'id',
    description: 'Announcement ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Announcement published successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Announcement not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Announcement is already published',
  })
  publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.announcementsService.publish(id, user);
  }

  @Patch(':id/unpublish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Unpublish an announcement' })
  @ApiParam({
    name: 'id',
    description: 'Announcement ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Announcement unpublished successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Announcement not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Announcement is not published',
  })
  unpublish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.announcementsService.unpublish(id, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Delete an announcement' })
  @ApiParam({
    name: 'id',
    description: 'Announcement ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Announcement deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Announcement not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You do not have permission to delete this announcement',
  })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.announcementsService.remove(id, user);
  }
}
