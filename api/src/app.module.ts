import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { UsersModule } from './users/users.module';
import { TeachersModule } from './teachers/teachers.module';
import { StudentsModule } from './students/students.module';
import { ParentsModule } from './parents/parents.module';
import { ParentStudentsModule } from './parent-students/parent-students.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { AcademicPeriodsModule } from './academic-periods/academic-periods.module';
import { CoursesModule } from './courses/courses.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ClassesModule } from './classes/classes.module';
import { ClassSubjectsModule } from './class-subjects/class-subjects.module';
import { ClassSubjectRequestsModule } from './class-subject-requests/class-subject-requests.module';
import { TeacherSubjectsModule } from './teacher-subjects/teacher-subjects.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AttendancesModule } from './attendances/attendances.module';
import { TeacherAttendancesModule } from './teacher-attendances/teacher-attendances.module';
import { LessonContentsModule } from './lesson-contents/lesson-contents.module';
import { LessonPlansModule } from './lesson-plans/lesson-plans.module';
import { GradesModule } from './grades/grades.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { ObservationsModule } from './observations/observations.module';
import { QuestionCategoriesModule } from './question-categories/question-categories.module';
import { QuestionsModule } from './questions/questions.module';
import { ActivitiesModule } from './activities/activities.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventsModule } from './events/events.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RankingsModule } from './rankings/rankings.module';
import { AchievementsModule } from './achievements/achievements.module';
import { ExamsModule } from './exams/exams.module';
import { SAEBDescriptorsModule } from './saeb-descriptors/saeb-descriptors.module';
import { IDEBModule } from './ideb/ideb.module';
import { CacheModule } from './cache/cache.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters';
import { CommonModule } from './common/common.module';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { TenantScopeGuard } from './auth/guards/tenant-scope.guard';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: '.env',
      cache: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: (configService.get<number>('throttle.ttl') ?? 60) * 1_000,
          limit: configService.get<number>('throttle.limit') ?? 300,
        },
      ],
    }),
    PrismaModule,
    CacheModule,
    AuthModule,
    InstitutionsModule,
    UsersModule,
    TeachersModule,
    StudentsModule,
    ParentsModule,
    ParentStudentsModule,
    AcademicYearsModule,
    AcademicPeriodsModule,
    CoursesModule,
    SubjectsModule,
    ClassesModule,
    ClassSubjectsModule,
    ClassSubjectRequestsModule,
    TeacherSubjectsModule,
    EnrollmentsModule,
    SchedulesModule,
    AttendancesModule,
    TeacherAttendancesModule,
    LessonContentsModule,
    LessonPlansModule,
    GradesModule,
    AssignmentsModule,
    ObservationsModule,
    QuestionCategoriesModule,
    QuestionsModule,
    ActivitiesModule,
    AnnouncementsModule,
    NotificationsModule,
    EventsModule,
    ReportsModule,
    DashboardModule,
    RankingsModule,
    AchievementsModule,
    ExamsModule,
    SAEBDescriptorsModule,
    IDEBModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Autenticação JWT global
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Autorização por roles global
    },
    {
      provide: APP_GUARD,
      useClass: TenantScopeGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
export class AppModule {}
