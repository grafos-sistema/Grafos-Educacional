import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import {
  JwtAuthGuard,
  RolesGuard,
  OwnershipGuard,
  InstitutionGuard,
  SuperAdminGuard,
  InstitutionAdminGuard,
  TeacherGuard,
  StudentGuard,
  ParentGuard,
  TenantScopeGuard,
} from './guards';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') ||
            '1d') as any,
        },
      }),
    }),
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    OwnershipGuard,
    InstitutionGuard,
    SuperAdminGuard,
    InstitutionAdminGuard,
    TeacherGuard,
    StudentGuard,
    ParentGuard,
    TenantScopeGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    OwnershipGuard,
    InstitutionGuard,
    SuperAdminGuard,
    InstitutionAdminGuard,
    TeacherGuard,
    StudentGuard,
    ParentGuard,
    TenantScopeGuard,
  ],
})
export class AuthModule {}
