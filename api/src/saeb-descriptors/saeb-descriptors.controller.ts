import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SAEBDescriptorsService } from './saeb-descriptors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('saeb-descriptors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SAEBDescriptorsController {
  constructor(
    private readonly saebDescriptorsService: SAEBDescriptorsService,
  ) {}

  /**
   * Listar todos os descritores SAEB
   * GET /saeb-descriptors
   */
  @Get()
  async findAll(
    @Query('subject') subject?: string,
    @Query('gradeLevel') gradeLevel?: string,
    @Query('skill') skill?: string,
  ) {
    return this.saebDescriptorsService.findAll({
      subject,
      gradeLevel,
      skill,
    });
  }

  /**
   * Buscar descritor por ID
   * GET /saeb-descriptors/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.saebDescriptorsService.findOne(id);
  }

  /**
   * Criar novo descritor
   * POST /saeb-descriptors
   */
  @Post()
  @Roles('INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async create(
    @Body()
    data: {
      code: string;
      subject: string;
      skill: string;
      description: string;
      gradeLevel: string;
    },
  ) {
    return this.saebDescriptorsService.create(data);
  }

  /**
   * Atualizar descritor
   * PUT /saeb-descriptors/:id
   */
  @Put(':id')
  @Roles('INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async update(
    @Param('id') id: string,
    @Body()
    data: {
      code?: string;
      subject?: string;
      skill?: string;
      description?: string;
      gradeLevel?: string;
    },
  ) {
    return this.saebDescriptorsService.update(id, data);
  }

  /**
   * Deletar descritor
   * DELETE /saeb-descriptors/:id
   */
  @Delete(':id')
  @Roles('INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async remove(@Param('id') id: string) {
    return this.saebDescriptorsService.remove(id);
  }

  /**
   * Seed de descritores - Português 5º ano
   * POST /saeb-descriptors/seed/portugues
   */
  @Post('seed/portugues')
  @Roles('INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async seedPortugues() {
    return this.saebDescriptorsService.seedPortugues5ano();
  }

  /**
   * Seed de descritores - Matemática 5º ano
   * POST /saeb-descriptors/seed/matematica
   */
  @Post('seed/matematica')
  @Roles('INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async seedMatematica() {
    return this.saebDescriptorsService.seedMatematica5ano();
  }

  /**
   * Seed completo (Português + Matemática)
   * POST /saeb-descriptors/seed/all
   */
  @Post('seed/all')
  @Roles('INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async seedAll() {
    return this.saebDescriptorsService.seedAll();
  }

  /**
   * Estatísticas dos descritores
   * GET /saeb-descriptors/statistics/overview
   */
  @Get('statistics/overview')
  @Roles('INSTITUTION_ADMIN', 'SUPER_ADMIN', 'TEACHER')
  async getStatistics() {
    return this.saebDescriptorsService.getStatistics();
  }
}
