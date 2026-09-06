# Graph Report - frontend  (2026-08-23)

## Corpus Check
- 291 files · ~638,042 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1520 nodes · 4353 edges · 112 communities (71 shown, 41 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `770aab18`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Badge.tsx
- cn
- professor/page.tsx
- classes.service.ts
- questions/page.tsx
- academic-years/[id]/page.tsx
- subjects/[id]/edit/page.tsx
- SubjectClassesManager.tsx
- user.types.ts
- rankings.service.ts
- exams.service.ts
- Modal.tsx
- compilerOptions
- useAuthStore
- auth.ts
- Sidebar.tsx
- BulkUserImportModal.tsx
- perfil/page.tsx
- coordenador/ideb/page.tsx
- api.ts
- announcements/page.tsx
- LoadingSpinner.tsx
- users/new/page.tsx
- AnnouncementComposerModal.tsx
- DatePickerInput.tsx
- teacher-schedules/page.tsx
- RoleBasedUserWizard.tsx
- EditUserPageContent.tsx
- professor/attendance/page.tsx
- professor/grades/page.tsx
- providers.tsx
- useAuth
- common.types.ts
- InstitutionLoginForm.tsx
- institutions.service.ts
- StudentFormTabs.tsx
- InstitutionFormTabs.tsx
- EventComposerModal.tsx
- manifest.json
- supabase.ts
- devDependencies
- observations/page.tsx
- AuthContext.tsx
- middleware.ts
- EventCalendar.tsx
- ErrorBoundary.tsx
- roles.ts
- events.service.ts
- package.json
- scripts
- dependencies
- Button.tsx
- communication/page.tsx
- institutions/[id]/edit/page.tsx
- api-url.ts
- AvatarCropModal.tsx
- vercel-postbuild-fix.mjs
- institution-unit-directors.ts
- SkeletonLoader.tsx
- app/[institution]/page.tsx
- sitemap.ts
- subject-colors.ts
- tailwind.config.ts
- autoprefixer
- axios
- date-fns
- eslint.config.mjs
- eslint-config-next
- framer-motion
- @headlessui/react
- @heroicons/react
- @heroui/react
- @hookform/resolvers
- jsdom
- jwt-decode
- lucide-react
- next
- next.config.ts
- react
- react-dom
- react-hook-form
- react-hot-toast
- @supabase/supabase-js
- tailwind-merge
- @tanstack/react-query
- @tiptap/extension-link
- @tiptap/extension-placeholder
- @tiptap/extension-underline
- @tiptap/pm
- @tiptap/react
- @tiptap/starter-kit
- zod
- zustand
- tailwindcss
- @testing-library/jest-dom
- @testing-library/user-event
- @types/node
- @types/react
- typescript
- @vitest/coverage-v8
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `useAuthStore` - 152 edges
2. `Button()` - 94 edges
3. `UserRole` - 66 edges
4. `Badge()` - 62 edges
5. `Select` - 57 edges
6. `LoadingSpinner()` - 55 edges
7. `Input` - 54 edges
8. `presentFriendlyError()` - 46 edges
9. `Modal()` - 40 edges
10. `usersService` - 35 edges

## Surprising Connections (you probably didn't know these)
- `ResetPasswordPage()` --calls--> `useAuthStore`  [EXTRACTED]
  src/app/(auth)/reset-password/page.tsx → src/stores/authStore.ts
- `AdminRankingsPage()` --calls--> `useAuthStore`  [EXTRACTED]
  src/app/(authenticated)/admin/rankings/page.tsx → src/stores/authStore.ts
- `SubjectsPage()` --calls--> `useAuthStore`  [EXTRACTED]
  src/app/(authenticated)/admin/subjects/page.tsx → src/stores/authStore.ts
- `NewUserPageContentProps` --references--> `UserRole`  [EXTRACTED]
  src/app/(authenticated)/admin/users/new/page.tsx → src/types/user.types.ts
- `StudentSchedulePage()` --calls--> `useAuthStore`  [EXTRACTED]
  src/app/(authenticated)/aluno/schedule/page.tsx → src/stores/authStore.ts

## Import Cycles
- None detected.

## Communities (112 total, 41 thin omitted)

### Community 0 - "Badge.tsx"
Cohesion: 0.07
Nodes (70): AcademicYearsPage(), AlunosPage(), EditClassPage(), ClassesPage(), CoordenadoresPage(), NewCoursePage(), CoursesPage(), DiretoresPage() (+62 more)

### Community 1 - "cn"
Cohesion: 0.05
Nodes (38): NotificationsPage(), inter, metadata, municipalityConfig, RootLayout(), viewport, Home(), SkipNav() (+30 more)

### Community 2 - "professor/page.tsx"
Cohesion: 0.06
Nodes (30): AdminLoginPage(), buildInitialPassword(), DIARY_ROWS, FEATURES, LoginFormData, loginSchema, PERKS, STUDENTS (+22 more)

### Community 3 - "classes.service.ts"
Cohesion: 0.07
Nodes (36): NewClassPage(), buildClassName(), classSectionOptions, classSeriesByCourseLevel, classShiftOptions, CourseSeriesConfig, fundamentalGrades, fundamentalOneGrades (+28 more)

### Community 4 - "questions/page.tsx"
Cohesion: 0.09
Nodes (34): DIFFICULTY_COLORS, DIFFICULTY_LABELS, QuestionBankPage(), TYPE_LABELS, DIFFICULTY_LABELS, TYPE_LABELS, DIFFICULTY_COLORS, DIFFICULTY_LABELS (+26 more)

### Community 5 - "academic-years/[id]/page.tsx"
Cohesion: 0.09
Nodes (34): AcademicYearDetailPage(), allDayOptions, CreateAcademicPeriodFormValues, defaultPeriodFormValues, getDateParts(), normalizeSelectDatePart(), periodTypeLabels, periodTypeOptions (+26 more)

### Community 6 - "subjects/[id]/edit/page.tsx"
Cohesion: 0.11
Nodes (30): EditSubjectPage(), NewSubjectPage(), CoordinatorSubjectRequestsPage(), SubjectRequestsPage(), SubjectNameSelector(), SubjectNameSelectorProps, buildCodeBase(), filterCatalogSubjects() (+22 more)

### Community 7 - "SubjectClassesManager.tsx"
Cohesion: 0.09
Nodes (30): genderLabels, ProfessorClassDetailsPage(), ProfessorDashboard(), MyClassesPage(), MySubjectsPage(), SubjectClassesManager(), SubjectClassesManagerProps, SubjectClassLink (+22 more)

### Community 8 - "user.types.ts"
Cohesion: 0.08
Nodes (27): AppUserRow, fetchUserFromSupabaseById(), loadParentStudentLinks(), loadUserProfiles(), mapUser(), mapUsers(), ParentProfileRow, StudentParentRow (+19 more)

### Community 9 - "rankings.service.ts"
Cohesion: 0.08
Nodes (31): AdminRankingsPage(), periodLabels, periodOptions, periodLabels, periodOptions, CoordinatorRankingsPage(), periodLabels, periodOptions (+23 more)

### Community 10 - "exams.service.ts"
Cohesion: 0.08
Nodes (26): PageProps, examTypeColors, examTypeLabels, PageProps, proficiencyLabels, examTypeLabels, PageProps, statusColors (+18 more)

### Community 11 - "Modal.tsx"
Cohesion: 0.12
Nodes (27): genderLabels, roleLabels, UserDetailPage(), CoordinatorLessonPlansPage(), statusColors, statusLabels, CoordinatorObservationsPage(), AttendancePage() (+19 more)

### Community 12 - "compilerOptions"
Cohesion: 0.06
Nodes (34): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+26 more)

### Community 13 - "useAuthStore"
Cohesion: 0.13
Nodes (21): PendingApprovalPage(), profileTypeLabels, SelectProfilePage(), AdminDashboard(), StudentAttendancePage(), AlunoDashboard(), StudentGradesPage(), CoordinatorDashboardPage() (+13 more)

### Community 14 - "auth.ts"
Cohesion: 0.10
Nodes (25): ResetPasswordPage(), ChangePasswordFormData, changePasswordSchema, ForgotPasswordFormData, forgotPasswordSchema, RegisterFormData, registerSchema, ResetPasswordFormData (+17 more)

### Community 15 - "Sidebar.tsx"
Cohesion: 0.10
Nodes (19): AuthenticatedContent(), AuthenticatedNavigationContext, AuthenticatedNavigationContextValue, AuthenticatedNavigationProvider(), defaultAuthenticatedNavigationValue, useAuthenticatedNavigation(), AuthenticatedPageSkeleton(), AuthenticatedShellSkeleton() (+11 more)

### Community 16 - "BulkUserImportModal.tsx"
Cohesion: 0.11
Nodes (26): ALL_HEADERS, BulkUserImportModal(), COMMON_HEADERS, detectDelimiter(), friendlyImportError(), headersForMode(), IMPORT_BATCH_OPTIONS, ImportBatchSize (+18 more)

### Community 17 - "perfil/page.tsx"
Cohesion: 0.14
Nodes (21): genderOptions, profileTypeOptions, buildOwnProfilePatch(), dateOnly(), genderLabels, PerfilPage(), InstitutionSearch, MaskedInput (+13 more)

### Community 18 - "coordenador/ideb/page.tsx"
Cohesion: 0.10
Nodes (10): LineChart(), LineChartProps, CalculateIDEBDto, CreateIDEBTargetDto, IDEBComparison, IDEBDashboard, IDEBIndicator, idebService (+2 more)

### Community 19 - "api.ts"
Cohesion: 0.09
Nodes (16): api, apiBaseUrl, AUTH_ROUTES_THAT_REQUIRE_RELOGIN, TODO: Fix circular dependency with authService, FriendlyErrorInfo, ParentsService, ParentStudent, questionImageUploadService (+8 more)

### Community 20 - "announcements/page.tsx"
Cohesion: 0.13
Nodes (23): AnnouncementFormState, AnnouncementsPage(), formatDate(), getDefaultScheduledDateTime(), getErrorMessage(), getInitialFilters(), getPriorityVariant(), getUserDisplayName() (+15 more)

### Community 21 - "LoadingSpinner.tsx"
Cohesion: 0.14
Nodes (13): DAYS_ORDER, StudentSchedulePage(), DAYS_ORDER, ClassStudentsManager(), ClassStudentsManagerProps, userName(), ClassSubjectsManager(), ClassSubjectsManagerProps (+5 more)

### Community 22 - "users/new/page.tsx"
Cohesion: 0.13
Nodes (11): RegisterPage(), defaultHeader, NewUserPageContent(), NewUserPageContentProps, roleHeader, roleOptions, Institution, InstitutionSearchProps (+3 more)

### Community 23 - "AnnouncementComposerModal.tsx"
Cohesion: 0.17
Nodes (18): AnnouncementComposerModal(), AnnouncementComposerModalProps, AnnouncementFormState, getDefaultScheduledDateTime(), getInitialForm(), roleOptionMap, Institution, InstitutionSwitcher() (+10 more)

### Community 24 - "DatePickerInput.tsx"
Cohesion: 0.16
Nodes (21): buildDateWithTime(), DatePickerInput, DatePickerInputProps, formatDateTimeLocalValue(), formatDisplayDate(), formatIsoDate(), formatTimeLabel(), getDatePart() (+13 more)

### Community 25 - "teacher-schedules/page.tsx"
Cohesion: 0.23
Nodes (18): AdminGradeView, AdminScheduleTab, TeacherSchedulesPage(), SchedulesManagementPage(), ViewMode, EnrichedScheduleItem, ProfessorMySchedulePage(), DAY_LABELS (+10 more)

### Community 26 - "RoleBasedUserWizard.tsx"
Cohesion: 0.11
Nodes (18): buildSteps(), genderOptions, getInitialPasswordFromEmail(), institutionLocation(), InstitutionOption, relationshipOptions, RoleBasedUserWizard(), RoleBasedUserWizardProps (+10 more)

### Community 27 - "EditUserPageContent.tsx"
Cohesion: 0.16
Nodes (12): buildInitialPassword(), EditUserFormData, EditUserPageContent(), EditUserPageContentProps, genderOptions, roleOptions, toDateInputValue(), parseStudentTagList() (+4 more)

### Community 28 - "professor/attendance/page.tsx"
Cohesion: 0.23
Nodes (12): daysOfWeek, SubjectsPage(), SubjectStats, attendancesService, classesService, Attendance, AttendanceFilters, AttendanceStats (+4 more)

### Community 29 - "professor/grades/page.tsx"
Cohesion: 0.21
Nodes (13): Tab, Tabs(), TabsProps, academicPeriodsService, gradesService, BulkGradeDto, CreateGradeDto, Grade (+5 more)

### Community 30 - "providers.tsx"
Cohesion: 0.18
Nodes (8): AppProviders(), AuthProviders(), createQueryClient(), ErrorDialogProvider(), AuthProvider(), useKeyboardFocus(), FriendlyErrorDialogPayload, registerErrorDialogHandler()

### Community 31 - "useAuth"
Cohesion: 0.14
Nodes (14): AlunoLogin(), buildInitialPassword(), LoginFormData, loginSchema, buildInitialPassword(), LoginFormData, loginSchema, PaisLoginPage() (+6 more)

### Community 32 - "common.types.ts"
Cohesion: 0.16
Nodes (12): LessonContentsFilterParams, lessonContentsService, LessonPlansFilterParams, ApiResponse, PaginatedResponse, SearchParams, CreateLessonContentDto, CreateLessonPlanDto (+4 more)

### Community 33 - "InstitutionLoginForm.tsx"
Cohesion: 0.20
Nodes (12): Institution, InstitutionLoginForm(), InstitutionLoginFormProps, getInstitution(), Institution, InstitutionLoginPage(), LoginPage(), useAccessibleForm() (+4 more)

### Community 34 - "institutions.service.ts"
Cohesion: 0.16
Nodes (13): BASE_SUBJECT_CATALOG, BaseSubjectDefinition, fetchInstitutionUnits(), fetchInstitutionWithUnits(), normalizeDigits(), normalizeInstitutionPayload(), normalizeText(), PublicInstitution (+5 more)

### Community 35 - "StudentFormTabs.tsx"
Cohesion: 0.14
Nodes (14): adultRequiredRelationships, genderOptions, getInitialPasswordFromEmail(), hasMinimumAge(), observationTypeOptions, responsibleRelationshipOptions, situationOptions, sortStudentDocuments() (+6 more)

### Community 36 - "InstitutionFormTabs.tsx"
Cohesion: 0.18
Nodes (15): DirectorOption, emptyUnit(), formatCnpj(), formatCpf(), formatPhone(), InstitutionDirectorRow, InstitutionFormTabs(), InstitutionFormTabsProps (+7 more)

### Community 37 - "EventComposerModal.tsx"
Cohesion: 0.17
Nodes (13): AUDIENCE_OPTIONS, buildInitialForm(), EVENT_TYPE_OPTIONS, EventComposerModal(), EventFormState, SCHOOL_LOCATIONS, toDateInput(), toIsoDate() (+5 more)

### Community 38 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, name, orientation, short_name (+5 more)

### Community 39 - "supabase.ts"
Cohesion: 0.19
Nodes (8): Institution, InstitutionsPage(), supabase, ClassSchedule, DbClassSchedule, firstRelation(), mapSchedule(), MaybeArray

### Community 40 - "devDependencies"
Cohesion: 0.15
Nodes (13): eslint, devDependencies, eslint, postcss, @testing-library/react, @types/react-dom, @vitejs/plugin-react, vitest (+5 more)

### Community 41 - "observations/page.tsx"
Cohesion: 0.28
Nodes (10): priorityColors, priorityLabels, typeLabels, observationsService, CreateObservationDto, Observation, ObservationFilters, ObservationPriority (+2 more)

### Community 42 - "AuthContext.tsx"
Cohesion: 0.29
Nodes (10): AuthContext, AuthContextType, AppUserRow, clearCurrentUserProfileCache(), fetchCurrentUserProfile(), fetchUserInstitutions(), isProfileCacheFresh(), mapAppUser() (+2 more)

### Community 43 - "middleware.ts"
Cohesion: 0.21
Nodes (10): authRoutes, checkRoleAccess(), config, getRedirectPathByRole(), middleware(), publicRoutes, roleRoutes, sharedAuthenticatedRoutes (+2 more)

### Community 44 - "EventCalendar.tsx"
Cohesion: 0.23
Nodes (11): EventCalendar(), EventCalendarProps, formatEventTime(), getEventsForDay(), MONTHS, readableDescription(), typeColors, typeLabels (+3 more)

### Community 45 - "ErrorBoundary.tsx"
Cohesion: 0.18
Nodes (3): ErrorBoundary, Props, State

### Community 46 - "roles.ts"
Cohesion: 0.22
Nodes (8): hasAllPermissions(), hasAnyPermission(), hasPermission(), Permission, ROLE_COLORS, ROLE_HIERARCHY, ROLE_LABELS, ROLE_PERMISSIONS

### Community 47 - "events.service.ts"
Cohesion: 0.22
Nodes (9): AcademicYearRow, ALLOWED_EVENT_ATTACHMENT_TYPES, EventRow, findEventsForGlobalAdmins(), findUpcomingEventsForGlobalAdmins(), withSignedAttachmentUrls(), EventAttachment, EventFilters (+1 more)

### Community 48 - "package.json"
Cohesion: 0.20
Nodes (9): engines, node, npm, name, overrides, tinyglobby, private, picomatch (+1 more)

### Community 49 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, lint, lint:check, start, test, test:ci (+2 more)

### Community 50 - "dependencies"
Cohesion: 0.22
Nodes (9): clsx, dependencies, clsx, react-imask, recharts, @tiptap/extension-text-align, react-imask, recharts (+1 more)

### Community 51 - "Button.tsx"
Cohesion: 0.25
Nodes (6): ConfiguracoesPage(), getMutationErrorMessage(), roleLabels, ButtonProps, ButtonSize, ButtonVariant

### Community 52 - "communication/page.tsx"
Cohesion: 0.25
Nodes (8): announcementBelongsToAudience(), audienceLabels, AudienceTab, CommunicationPage(), priorityColors, priorityLabels, roleLabels, announcementsService

### Community 53 - "institutions/[id]/edit/page.tsx"
Cohesion: 0.31
Nodes (7): EditInstitutionPage(), EditInstitutionPageProps, normalizeIsActive(), NewInstitutionPage(), normalizeIsActive(), InstitutionFormValues, institutionsService

### Community 54 - "api-url.ts"
Cohesion: 0.36
Nodes (7): getApiBaseUrl(), getApiConfigurationMessage(), isLocalBrowserHost(), LOCAL_HOSTNAMES, normalizeApiUrl(), getImageUrl(), getImageUrls()

### Community 55 - "AvatarCropModal.tsx"
Cohesion: 0.39
Nodes (7): AvatarCropModal(), AvatarCropModalProps, clamp(), getDistance(), getOutputType(), Point, replaceFileExtension()

### Community 56 - "vercel-postbuild-fix.mjs"
Cohesion: 0.29
Nodes (5): nextDir, parentNextDir, parentNodeModulesDir, parentRoot, projectRoot

### Community 57 - "institution-unit-directors.ts"
Cohesion: 0.48
Nodes (6): buildDirectorName(), InstitutionUnitDirectorDraft, resolveInstitutionUnitDirectors(), sanitizeDigits(), trimToUndefined(), InstitutionUnit

### Community 60 - "app/[institution]/page.tsx"
Cohesion: 0.60
Nodes (4): generateMetadata(), getInstitution(), Institution, InstitutionPage()

### Community 61 - "sitemap.ts"
Cohesion: 0.67
Nodes (3): getInstitutions(), sitemap(), SitemapInstitution

## Knowledge Gaps
- **453 isolated node(s):** `eslintConfig`, `publicRoutes`, `authRoutes`, `sharedAuthenticatedRoutes`, `roleRoutes` (+448 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuthStore` connect `useAuthStore` to `Badge.tsx`, `cn`, `professor/page.tsx`, `classes.service.ts`, `questions/page.tsx`, `academic-years/[id]/page.tsx`, `subjects/[id]/edit/page.tsx`, `SubjectClassesManager.tsx`, `user.types.ts`, `rankings.service.ts`, `exams.service.ts`, `Modal.tsx`, `auth.ts`, `perfil/page.tsx`, `api.ts`, `announcements/page.tsx`, `LoadingSpinner.tsx`, `users/new/page.tsx`, `AnnouncementComposerModal.tsx`, `teacher-schedules/page.tsx`, `EditUserPageContent.tsx`, `professor/attendance/page.tsx`, `professor/grades/page.tsx`, `providers.tsx`, `useAuth`, `StudentFormTabs.tsx`, `observations/page.tsx`, `AuthContext.tsx`, `events.service.ts`, `Button.tsx`, `communication/page.tsx`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `Button()` connect `useAuthStore` to `Badge.tsx`, `professor/page.tsx`, `classes.service.ts`, `questions/page.tsx`, `academic-years/[id]/page.tsx`, `subjects/[id]/edit/page.tsx`, `SubjectClassesManager.tsx`, `rankings.service.ts`, `exams.service.ts`, `Modal.tsx`, `auth.ts`, `BulkUserImportModal.tsx`, `perfil/page.tsx`, `announcements/page.tsx`, `LoadingSpinner.tsx`, `users/new/page.tsx`, `AnnouncementComposerModal.tsx`, `teacher-schedules/page.tsx`, `RoleBasedUserWizard.tsx`, `EditUserPageContent.tsx`, `professor/attendance/page.tsx`, `professor/grades/page.tsx`, `StudentFormTabs.tsx`, `InstitutionFormTabs.tsx`, `EventComposerModal.tsx`, `observations/page.tsx`, `EventCalendar.tsx`, `ErrorBoundary.tsx`, `Button.tsx`, `institutions/[id]/edit/page.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `UserRole` connect `Badge.tsx` to `cn`, `academic-years/[id]/page.tsx`, `SubjectClassesManager.tsx`, `user.types.ts`, `Modal.tsx`, `useAuthStore`, `Sidebar.tsx`, `BulkUserImportModal.tsx`, `announcements/page.tsx`, `LoadingSpinner.tsx`, `users/new/page.tsx`, `AnnouncementComposerModal.tsx`, `teacher-schedules/page.tsx`, `RoleBasedUserWizard.tsx`, `EditUserPageContent.tsx`, `professor/attendance/page.tsx`, `professor/grades/page.tsx`, `useAuth`, `StudentFormTabs.tsx`, `InstitutionFormTabs.tsx`, `observations/page.tsx`, `AuthContext.tsx`, `roles.ts`, `events.service.ts`, `communication/page.tsx`, `institution-unit-directors.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `publicRoutes`, `authRoutes` to the rest of the system?**
  _453 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Badge.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07182416060920734 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.0546448087431694 - nodes in this community are weakly interconnected._
- **Should `professor/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.058673469387755105 - nodes in this community are weakly interconnected._