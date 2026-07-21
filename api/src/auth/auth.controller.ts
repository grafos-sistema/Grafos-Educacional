import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, PublicRegisterDto, RefreshTokenDto, AuthResponseDto } from './dto';
import { Public, ApiStandardResponses, CurrentUser, Roles, ApiAuth } from '../common/decorators';
import type { CurrentUserPayload } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('public-register')
  @Public()
  @ApiOperation({
    summary: 'Auto-registro público de usuário',
    description: `
Permite que usuários se auto-registrem no sistema de forma pública.

**Fluxo:**
1. Usuário preenche dados pessoais e escolhe a instituição
2. Indica qual tipo de perfil deseja (Professor, Aluno ou Responsável)
3. Conta é criada como ATIVA mas SEM o perfil correspondente
4. Usuário pode fazer login imediatamente
5. Vê tela de "Aguardando aprovação do perfil"
6. Admin da instituição aprova e adiciona o perfil solicitado
7. Usuário ganha acesso completo ao sistema

**Observações:**
- Email e CPF devem ser únicos
- Senha deve ter no mínimo 6 caracteres
- Instituição deve existir e estar ativa
- Retorna tokens JWT para login imediato
- Perfil (teacher/student/parent) só é adicionado após aprovação do admin
    `,
  })
  @ApiCreatedResponse({
    description: 'Usuário auto-registrado com sucesso',
    type: AuthResponseDto,
  })
  @ApiStandardResponses()
  async publicRegister(@Body() publicRegisterDto: PublicRegisterDto) {
    return this.authService.publicRegister(publicRegisterDto);
  }

  @Post('register')
  @Public()
  @ApiOperation({
    summary: 'Registrar novo usuário (Admin)',
    description: `
Cria um novo usuário no sistema (apenas para administradores).

**Observações:**
- O email deve ser único
- A senha deve ter no mínimo 6 caracteres
- O CPF, se fornecido, deve ter 11 dígitos
- A instituição deve existir e estar ativa
- Retorna os tokens JWT (access e refresh) junto com os dados do usuário

**Roles disponíveis:**
- SUPER_ADMIN: Administrador do sistema
- INSTITUTION_ADMIN: Administrador da instituição
- COORDINATOR: Coordenador pedagógico
- TEACHER: Professor
- STUDENT: Aluno
- PARENT: Responsável/Pai
    `,
  })
  @ApiCreatedResponse({
    description: 'Usuário registrado com sucesso',
    type: AuthResponseDto,
  })
  @ApiStandardResponses()
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Realizar login',
    description: `
Autentica um usuário e retorna os tokens JWT.

**Observações:**
- O usuário deve estar ativo
- A instituição do usuário deve estar ativa
- Retorna access token (válido por 1 dia) e refresh token (válido por 7 dias)
- Use o access token no header Authorization: Bearer {token}

**Exemplo de uso:**
1. Faça login e copie o accessToken
2. Clique no botão "Authorize" no topo da página
3. Cole o token e clique em "Authorize"
4. Agora você pode testar endpoints protegidos
    `,
  })
  @ApiOkResponse({
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiStandardResponses()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar access token',
    description: `
Gera um novo access token usando o refresh token.

**Quando usar:**
- Quando o access token expirar (após 1 dia)
- Para manter o usuário logado sem pedir senha novamente

**Observações:**
- O refresh token é válido por 7 dias
- Retorna novos access token e refresh token
- O usuário deve estar ativo
    `,
  })
  @ApiOkResponse({
    description: 'Token atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiStandardResponses()
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('me')
  @ApiAuth()
  @ApiOperation({
    summary: 'Obter dados do usuário autenticado',
    description: `
Retorna os dados do usuário autenticado baseado no token JWT.

**Requer autenticação:**
- Endpoint protegido
- Necessita token JWT válido no header Authorization

**Exemplo de uso:**
1. Faça login para obter o token
2. Adicione o token no header: Authorization: Bearer {token}
3. Faça a requisição para este endpoint
    `,
  })
  @ApiOkResponse({
    description: 'Dados do usuário autenticado',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        email: { type: 'string', example: 'usuario@escola.com' },
        firstName: { type: 'string', example: 'João' },
        lastName: { type: 'string', example: 'Silva' },
        role: { type: 'string', example: 'TEACHER' },
        institutionId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174001' },
      },
    },
  })
  @ApiStandardResponses()
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  @Get('profile')
  @ApiAuth()
  @ApiOperation({
    summary: 'Obter perfil completo do usuário',
    description: `
Retorna os dados completos do usuário autenticado, incluindo:
- Dados pessoais
- Perfis (teacher, student, parent)
- Instituições vinculadas
- Instituição atual

**Requer autenticação:**
- Endpoint protegido
- Necessita token JWT válido no header Authorization
    `,
  })
  @ApiOkResponse({
    description: 'Perfil completo do usuário',
  })
  @ApiStandardResponses()
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.userId);
  }

  @Get('institutions')
  @ApiAuth()
  @ApiOperation({
    summary: 'Listar instituições do usuário',
    description: `
Retorna todas as instituições às quais o usuário tem acesso.

**Retorna:**
- Instituição principal (sempre presente)
- Instituições adicionais (UserInstitution)
- Flags: isPrimary, isCurrent
    `,
  })
  @ApiOkResponse({
    description: 'Lista de instituições',
  })
  @ApiStandardResponses()
  async getInstitutions(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getUserInstitutions(user.userId);
  }

  @Post('switch-institution')
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Trocar instituição ativa',
    description: `
Troca a instituição ativa do usuário e retorna novos tokens JWT.

**Observações:**
- O usuário deve ter acesso à instituição
- Retorna novos tokens com a nova instituição no payload
- Use os novos tokens para acessar dados da nova instituição
    `,
  })
  @ApiOkResponse({
    description: 'Tokens atualizados com nova instituição',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiStandardResponses()
  async switchInstitution(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { institutionId: string },
  ) {
    return this.authService.switchInstitution(user.userId, body.institutionId);
  }

  @Get('admin-only')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiAuth()
  @ApiOperation({
    summary: 'Endpoint apenas para administradores',
    description: `
Endpoint de exemplo que demonstra o uso de autorização por roles.

**Roles permitidos:**
- SUPER_ADMIN
- INSTITUTION_ADMIN

**Outros usuários receberão erro 403 (Forbidden).**
    `,
  })
  @ApiOkResponse({
    description: 'Acesso permitido',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Acesso permitido para administradores' },
        user: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiStandardResponses()
  async adminOnly(@CurrentUser() user: CurrentUserPayload) {
    return {
      message: 'Acesso permitido para administradores',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }
}
