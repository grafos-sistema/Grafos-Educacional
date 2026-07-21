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
import { QuestionCategoriesService } from './question-categories.service';
import { CreateQuestionCategoryDto } from './dto/create-question-category.dto';
import { UpdateQuestionCategoryDto } from './dto/update-question-category.dto';
import { QueryQuestionCategoryDto } from './dto/query-question-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Question Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('question-categories')
export class QuestionCategoriesController {
  constructor(private readonly questionCategoriesService: QuestionCategoriesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new question category (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'Question category created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'A category with this name already exists',
  })
  create(@Body() createQuestionCategoryDto: CreateQuestionCategoryDto) {
    return this.questionCategoriesService.create(createQuestionCategoryDto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get all question categories with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of question categories with pagination',
  })
  findAll(@Query() query: QueryQuestionCategoryDto) {
    return this.questionCategoriesService.findAll(query);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get a specific question category by ID' })
  @ApiParam({
    name: 'id',
    description: 'Question category ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Question category details',
  })
  @ApiResponse({
    status: 404,
    description: 'Question category not found',
  })
  findOne(@Param('id') id: string) {
    return this.questionCategoriesService.findOne(id);
  }

  @Get(':id/statistics')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get statistics for a question category' })
  @ApiParam({
    name: 'id',
    description: 'Question category ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Question category statistics',
  })
  @ApiResponse({
    status: 404,
    description: 'Question category not found',
  })
  getStatistics(@Param('id') id: string) {
    return this.questionCategoriesService.getStatistics(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a question category (SUPER_ADMIN only)' })
  @ApiParam({
    name: 'id',
    description: 'Question category ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Question category updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Question category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'A category with this name already exists',
  })
  update(
    @Param('id') id: string,
    @Body() updateQuestionCategoryDto: UpdateQuestionCategoryDto,
  ) {
    return this.questionCategoriesService.update(id, updateQuestionCategoryDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a question category (SUPER_ADMIN only)' })
  @ApiParam({
    name: 'id',
    description: 'Question category ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Question category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Question category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete category with associated questions',
  })
  remove(@Param('id') id: string) {
    return this.questionCategoriesService.remove(id);
  }
}
