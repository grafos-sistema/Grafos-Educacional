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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { questionImageMulterConfig } from '../common/config/question-image-multer.config';

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new question (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Question category not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid question data (e.g., missing options for multiple choice)',
  })
  create(@Body() createQuestionDto: CreateQuestionDto, @CurrentUser() user: any) {
    return this.questionsService.create(createQuestionDto, user);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get all questions with advanced filters' })
  @ApiResponse({
    status: 200,
    description: 'List of questions with pagination',
  })
  findAll(@Query() query: QueryQuestionDto) {
    return this.questionsService.findAll(query);
  }

  @Get('statistics')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
  )
  @ApiOperation({ summary: 'Get question bank statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics about the question bank',
  })
  getStatistics() {
    return this.questionsService.getStatistics();
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get a specific question by ID' })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Question details',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Post(':id/duplicate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER)
  @ApiOperation({ summary: 'Duplicate a question' })
  @ApiParam({
    name: 'id',
    description: 'Question ID to duplicate',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Question duplicated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  duplicate(@Param('id') id: string) {
    return this.questionsService.duplicate(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a question (SUPER_ADMIN only)' })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Question updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid question data',
  })
  update(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a question (SUPER_ADMIN only)' })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Question deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete question that is used in activities',
  })
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }

  @Post('upload-image')
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('image', questionImageMulterConfig))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de imagem para questão (SUPER_ADMIN only)',
    description:
      'Faz upload de uma imagem ilustrativa para usar em questões. Formatos aceitos: JPEG, PNG, WEBP, GIF. Tamanho máximo: 10MB.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Imagem enviada com sucesso',
    schema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          example: '/public/question-images/question-1234567890-123456789.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou não enviado',
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }
    // Retorna a URL com o prefixo public para servir os arquivos estáticos
    return { imageUrl: `/public/question-images/${file.filename}` };
  }
}
