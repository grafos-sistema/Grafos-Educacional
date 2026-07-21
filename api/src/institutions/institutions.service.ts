import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstitutionDto, UpdateInstitutionDto } from './dto';

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova instituição
   */
  async create(createInstitutionDto: CreateInstitutionDto) {
    const { slug, cnpj, ...data } = createInstitutionDto;

    // Gera slug se não fornecido
    const generatedSlug =
      slug || this.generateSlug(createInstitutionDto.name);

    // Verifica se slug já existe
    const existingSlug = await this.prisma.institution.findUnique({
      where: { slug: generatedSlug },
    });

    if (existingSlug) {
      throw new ConflictException('Slug já está em uso');
    }

    // Verifica se CNPJ já existe
    if (cnpj) {
      // Valida CNPJ
      if (!this.validateCNPJ(cnpj)) {
        throw new BadRequestException('CNPJ inválido');
      }

      const existingCNPJ = await this.prisma.institution.findUnique({
        where: { cnpj },
      });

      if (existingCNPJ) {
        throw new ConflictException('CNPJ já cadastrado');
      }
    }

    return this.prisma.institution.create({
      data: {
        ...data,
        slug: generatedSlug,
        cnpj,
      },
    });
  }

  /**
   * Lista todas as instituições ativas (endpoint público)
   */
  async findAllActive() {
    return this.prisma.institution.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        state: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Lista todas as instituições com paginação e filtros
   */
  async findAll(page = 1, limit = 20, search?: string, isActive?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.institution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.institution.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Busca uma instituição por slug (público)
   */
  async findBySlug(slug: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        logo: true,
        isActive: true,
      },
    });

    if (!institution) {
      throw new NotFoundException('Instituição não encontrada');
    }

    if (!institution.isActive) {
      throw new NotFoundException('Instituição não está ativa');
    }

    return institution;
  }

  /**
   * Busca uma instituição por ID
   */
  async findOne(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            academicYears: true,
            courses: true,
            classes: true,
            subjects: true,
          },
        },
      },
    });

    if (!institution) {
      throw new NotFoundException('Instituição não encontrada');
    }

    return institution;
  }

  /**
   * Atualiza uma instituição
   */
  async update(id: string, updateInstitutionDto: UpdateInstitutionDto) {
    // Verifica se instituição existe
    await this.findOne(id);

    const { slug, cnpj, ...data } = updateInstitutionDto;

    // Verifica slug único se fornecido
    if (slug) {
      const existingSlug = await this.prisma.institution.findUnique({
        where: { slug },
      });

      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException('Slug já está em uso');
      }
    }

    // Verifica CNPJ único se fornecido
    if (cnpj) {
      // Valida CNPJ
      if (!this.validateCNPJ(cnpj)) {
        throw new BadRequestException('CNPJ inválido');
      }

      const existingCNPJ = await this.prisma.institution.findUnique({
        where: { cnpj },
      });

      if (existingCNPJ && existingCNPJ.id !== id) {
        throw new ConflictException('CNPJ já cadastrado');
      }
    }

    return this.prisma.institution.update({
      where: { id },
      data: {
        ...data,
        slug,
        cnpj,
      },
    });
  }

  /**
   * Remove uma instituição (soft delete)
   */
  async remove(id: string) {
    // Verifica se instituição existe
    await this.findOne(id);

    // Verifica se há usuários ativos
    const activeUsers = await this.prisma.user.count({
      where: {
        institutionId: id,
        isActive: true,
      },
    });

    if (activeUsers > 0) {
      throw new BadRequestException(
        `Não é possível excluir instituição com ${activeUsers} usuário(s) ativo(s)`,
      );
    }

    return this.prisma.institution.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Gera slug a partir do nome
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  }

  /**
   * Valida CNPJ
   */
  private validateCNPJ(cnpj: string): boolean {
    // Remove formatação
    cnpj = cnpj.replace(/[^\d]/g, '');

    if (cnpj.length !== 14) {
      return false;
    }

    // Elimina CNPJs invalidos conhecidos
    if (/^(\d)\1+$/.test(cnpj)) {
      return false;
    }

    // Valida DVs
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) {
      return false;
    }

    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) {
      return false;
    }

    return true;
  }
}
