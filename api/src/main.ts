import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get ConfigService
  const configService = app.get(ConfigService);
  const isProduction = process.env.NODE_ENV === 'production';
  const corsOrigins = configService.get<string[]>('cors.origins') || [];

  // Railway/Vercel encaminham o IP original por proxy. Isto é necessário para
  // que o rate limiter agrupe requisições pelo cliente correto.
  app.set('trust proxy', 1);

  // Serve static files from public folder (without authentication)
  // __dirname em código compilado aponta para 'api/dist/src'
  // Precisamos subir 2 níveis: dist/src -> dist -> api, depois public
  const publicPath = resolve(__dirname, '..', '..', 'public');
  logger.log(`📁 Serving static files from: ${publicPath}`);
  app.useStaticAssets(publicPath, {
    prefix: '/public/',
  });

  // Security: Helmet - Protege a aplicação de vulnerabilidades web conhecidas
  app.use(
    helmet(
      isProduction
        ? {
            contentSecurityPolicy: {
              directives: {
                defaultSrc: [`'none'`],
                frameAncestors: [`'none'`],
              },
            },
            crossOriginEmbedderPolicy: false,
          }
        : {
            contentSecurityPolicy: {
              directives: {
                defaultSrc: [`'self'`],
                styleSrc: [`'self'`, `'unsafe-inline'`],
                scriptSrc: [`'self'`, `'unsafe-inline'`],
                imgSrc: [`'self'`, 'data:', 'https:'],
              },
            },
            crossOriginEmbedderPolicy: false,
          },
    ),
  );

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas nos DTOs
      forbidNonWhitelisted: true, // Lança erro se propriedades não permitidas forem enviadas
      transform: true, // Transforma payloads em instâncias de DTOs
      transformOptions: {
        enableImplicitConversion: true, // Converte tipos automaticamente
      },
      disableErrorMessages: false, // Exibe mensagens de erro detalhadas
    }),
  );

  // CORS por allowlist: evita refletir origens arbitrárias com credenciais.
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origem não autorizada pelo CORS'));
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'x-skip-error-toast',
    ],
    maxAge: 86_400,
  });

  logger.log(
    `[security:cors] allowedOrigins=${corsOrigins.join(',') || 'none'} credentials=false`,
  );

  // Swagger Configuration
  const swaggerEnabled =
    configService.get<boolean>('swagger.enabled') ?? !isProduction;
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Sistema de Gestão Escolar - API')
      .setDescription(
        `API REST completa para gestão escolar com autenticação JWT e controle de acesso baseado em roles.

## Funcionalidades Principais

### Para Professores
- Lançamento de presença
- Registro de conteúdo ministrado
- Notas e avaliações
- Plano de ensino
- Criação de atividades impressas
- Observações individuais

### Para Alunos
- Consulta de notas e faltas
- Acesso ao conteúdo das aulas
- Avisos e comunicados
- Área de tarefas

### Para Responsáveis/Pais
- Acompanhamento da vida escolar
- Notificações automáticas
- Comunicados da escola

### Para Gestores/Coordenação
- Painel administrativo com relatórios
- Controle de calendários letivos
- Relatórios pedagógicos
- Gestão de usuários
- Banco de questões

## Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Para acessar endpoints protegidos:

1. Faça login no endpoint \`POST /api/v1/auth/login\`
2. Copie o token retornado
3. Clique no botão "Authorize" no topo desta página
4. Cole o token no campo e clique em "Authorize"

## Controle de Acesso (RBAC)

A API possui 6 níveis de acesso:
- **SUPER_ADMIN**: Administrador do sistema
- **INSTITUTION_ADMIN**: Administrador da instituição
- **COORDINATOR**: Coordenador pedagógico
- **TEACHER**: Professor
- **STUDENT**: Aluno
- **PARENT**: Responsável/Pai`,
      )
      .setVersion('1.0')
      .setContact(
        'Suporte Técnico',
        'https://github.com/seu-repositorio',
        'suporte@escola.com',
      )
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Insira o token JWT obtido no endpoint de login',
          in: 'header',
        },
        'JWT-auth', // Nome da security scheme
      )
      .addTag('Auth', 'Endpoints de autenticação e registro')
      .addTag('Users', 'Gestão de usuários')
      .addTag('Institutions', 'Gestão de instituições')
      .addTag('Teachers', 'Gestão de professores')
      .addTag('Students', 'Gestão de alunos')
      .addTag('Parents', 'Gestão de pais/responsáveis')
      .addTag('Academic Years', 'Gestão de anos letivos')
      .addTag('Academic Periods', 'Gestão de períodos acadêmicos')
      .addTag('Courses', 'Gestão de cursos')
      .addTag('Subjects', 'Gestão de disciplinas')
      .addTag('Classes', 'Gestão de turmas')
      .addTag('Enrollments', 'Gestão de matrículas')
      .addTag('Schedules', 'Gestão de grade horária')
      .addTag('Attendances', 'Gestão de frequência')
      .addTag('Lesson Contents', 'Conteúdo ministrado')
      .addTag('Lesson Plans', 'Planos de ensino')
      .addTag('Grades', 'Notas e avaliações')
      .addTag('Assignments', 'Tarefas e atividades online')
      .addTag('Observations', 'Observações sobre alunos')
      .addTag('Question Categories', 'Categorias de questões')
      .addTag('Questions', 'Banco de questões')
      .addTag('Activities', 'Atividades impressas')
      .addTag('Announcements', 'Comunicados escolares')
      .addTag('Notifications', 'Notificações')
      .addTag('Events', 'Calendário de eventos')
      .addTag('Reports', 'Relatórios e exportações')
      .addTag('Dashboard', 'Dashboards e estatísticas')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // Mantém o token entre reloads
        docExpansion: 'none', // Colapsa todas as seções por padrão
        filter: true, // Habilita busca
        showRequestDuration: true, // Mostra duração das requisições
        syntaxHighlight: {
          activate: true,
          theme: 'monokai',
        },
        tryItOutEnabled: true,
      },
      customSiteTitle: 'API Docs - Sistema de Gestão Escolar',
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
      customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 36px; }
    `,
    });
  }

  const port =
    Number(process.env.PORT) || configService.get<number>('app.port') || 3333;
  const appName = configService.get<string>('app.name') || 'API';

  logger.log(
    `[debug:bootstrap] NODE_ENV=${process.env.NODE_ENV || 'undefined'} PORT_ENV=${process.env.PORT || 'undefined'} LISTEN_PORT=${port}`,
  );
  logger.log(
    `[debug:bootstrap] configuredCorsOrigins=${corsOrigins.join(',') || 'none'}`,
  );

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 ${appName} running on: http://localhost:${port}`);
  logger.log(
    swaggerEnabled
      ? `📚 Swagger Docs: http://localhost:${port}/api/docs`
      : '🔒 Swagger desativado neste ambiente',
  );
  logger.log(`📊 Environment: ${configService.get('app.env')}`);
}

bootstrap();
