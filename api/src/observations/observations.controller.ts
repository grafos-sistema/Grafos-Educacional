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
import { ObservationsService } from './observations.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { QueryObservationDto } from './dto/query-observation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Observations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('observations')
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Create a new observation about a student' })
  @ApiResponse({
    status: 201,
    description: 'Observation created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  create(
    @Body() createObservationDto: CreateObservationDto,
    @CurrentUser() user: any,
  ) {
    return this.observationsService.create(createObservationDto, user.userId);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get all observations with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of observations with pagination',
  })
  findAll(@Query() query: QueryObservationDto, @CurrentUser() user: any) {
    return this.observationsService.findAll(query, user);
  }

  @Get('student/:studentId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get all observations for a specific student' })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of observations for the student',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  findByStudent(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    return this.observationsService.findByStudent(studentId, user);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get a specific observation by ID' })
  @ApiParam({
    name: 'id',
    description: 'Observation ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Observation details',
  })
  @ApiResponse({
    status: 404,
    description: 'Observation not found',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.observationsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update an observation' })
  @ApiParam({
    name: 'id',
    description: 'Observation ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Observation updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Observation not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - you do not have permission to update this observation',
  })
  update(
    @Param('id') id: string,
    @Body() updateObservationDto: UpdateObservationDto,
    @CurrentUser() user: any,
  ) {
    return this.observationsService.update(id, updateObservationDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER)
  @ApiOperation({ summary: 'Delete an observation' })
  @ApiParam({
    name: 'id',
    description: 'Observation ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Observation deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Observation not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - you do not have permission to delete this observation',
  })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.observationsService.remove(id, user);
  }
}
