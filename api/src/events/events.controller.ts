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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Institution or class not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid dates or data',
  })
  create(@Body() createEventDto: CreateEventDto, @CurrentUser() user: any) {
    return this.eventsService.create(createEventDto, user.userId);
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
  @ApiOperation({ summary: 'Get all events with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of events with pagination',
  })
  findAll(@Query() query: QueryEventDto, @CurrentUser() user: any) {
    return this.eventsService.findAll(query, user);
  }

  @Get('upcoming')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming events',
  })
  findUpcoming(@Query('days') days: string = '30', @CurrentUser() user: any) {
    return this.eventsService.findUpcoming(parseInt(days, 10) || 30, user);
  }

  @Get('calendar/:year/:month')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get calendar view for a specific month' })
  @ApiParam({
    name: 'year',
    description: 'Year',
    type: Number,
    example: 2024,
  })
  @ApiParam({
    name: 'month',
    description: 'Month (1-12)',
    type: Number,
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Calendar with events grouped by day',
  })
  getCalendar(@Query() query: CalendarQueryDto, @CurrentUser() user: any) {
    return this.eventsService.getCalendar(query, user);
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
  @ApiOperation({ summary: 'Get a specific event by ID' })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Event details',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You do not have access to this event',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You do not have permission to edit this event',
  })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.update(id, updateEventDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Event deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You do not have permission to delete this event',
  })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.remove(id, user);
  }
}
