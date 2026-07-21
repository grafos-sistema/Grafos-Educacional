export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_periods: {
        Row: {
          academicYearId: string
          createdAt: string
          endDate: string
          id: string
          isActive: boolean
          name: string
          orderNumber: number
          startDate: string
          type: Database["public"]["Enums"]["AcademicPeriodType"]
          updatedAt: string
        }
        Insert: {
          academicYearId: string
          createdAt?: string
          endDate: string
          id: string
          isActive?: boolean
          name: string
          orderNumber: number
          startDate: string
          type: Database["public"]["Enums"]["AcademicPeriodType"]
          updatedAt: string
        }
        Update: {
          academicYearId?: string
          createdAt?: string
          endDate?: string
          id?: string
          isActive?: boolean
          name?: string
          orderNumber?: number
          startDate?: string
          type?: Database["public"]["Enums"]["AcademicPeriodType"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_periods_academicYearId_fkey"
            columns: ["academicYearId"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_years: {
        Row: {
          createdAt: string
          endDate: string
          id: string
          institutionId: string
          isActive: boolean
          name: string
          startDate: string
          updatedAt: string
          year: number
        }
        Insert: {
          createdAt?: string
          endDate: string
          id: string
          institutionId: string
          isActive?: boolean
          name: string
          startDate: string
          updatedAt: string
          year: number
        }
        Update: {
          createdAt?: string
          endDate?: string
          id?: string
          institutionId?: string
          isActive?: boolean
          name?: string
          startDate?: string
          updatedAt?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          badgeId: string
          id: string
          unlockedAt: string
          userId: string
        }
        Insert: {
          badgeId: string
          id: string
          unlockedAt?: string
          userId: string
        }
        Update: {
          badgeId?: string
          id?: string
          unlockedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_badgeId_fkey"
            columns: ["badgeId"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievements_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activityDate: string | null
          classId: string | null
          createdAt: string
          description: string | null
          footerTemplate: string | null
          headerTemplate: string | null
          id: string
          institutionId: string
          instructions: string | null
          isPublished: boolean
          publishedAt: string | null
          showAnswerKey: boolean
          subjectId: string | null
          teacherId: string
          title: string
          totalPoints: number | null
          updatedAt: string
        }
        Insert: {
          activityDate?: string | null
          classId?: string | null
          createdAt?: string
          description?: string | null
          footerTemplate?: string | null
          headerTemplate?: string | null
          id: string
          institutionId: string
          instructions?: string | null
          isPublished?: boolean
          publishedAt?: string | null
          showAnswerKey?: boolean
          subjectId?: string | null
          teacherId: string
          title: string
          totalPoints?: number | null
          updatedAt: string
        }
        Update: {
          activityDate?: string | null
          classId?: string | null
          createdAt?: string
          description?: string | null
          footerTemplate?: string | null
          headerTemplate?: string | null
          id?: string
          institutionId?: string
          instructions?: string | null
          isPublished?: boolean
          publishedAt?: string | null
          showAnswerKey?: boolean
          subjectId?: string | null
          teacherId?: string
          title?: string
          totalPoints?: number | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_subjectId_fkey"
            columns: ["subjectId"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_questions: {
        Row: {
          activityId: string
          createdAt: string
          customPoints: number | null
          customStatement: string | null
          id: string
          orderNumber: number
          pageBreakBefore: boolean
          questionId: string
          updatedAt: string
        }
        Insert: {
          activityId: string
          createdAt?: string
          customPoints?: number | null
          customStatement?: string | null
          id: string
          orderNumber: number
          pageBreakBefore?: boolean
          questionId: string
          updatedAt: string
        }
        Update: {
          activityId?: string
          createdAt?: string
          customPoints?: number | null
          customStatement?: string | null
          id?: string
          orderNumber?: number
          pageBreakBefore?: boolean
          questionId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_questions_activityId_fkey"
            columns: ["activityId"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_questions_questionId_fkey"
            columns: ["questionId"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          attachments: string | null
          content: string
          createdAt: string
          createdById: string
          expiresAt: string | null
          id: string
          institutionId: string | null
          isPublished: boolean
          priority: string
          publishedAt: string | null
          targetRoles: string[] | null
          title: string
          updatedAt: string
        }
        Insert: {
          attachments?: string | null
          content: string
          createdAt?: string
          createdById: string
          expiresAt?: string | null
          id: string
          institutionId?: string | null
          isPublished?: boolean
          priority?: string
          publishedAt?: string | null
          targetRoles?: string[] | null
          title: string
          updatedAt: string
        }
        Update: {
          attachments?: string | null
          content?: string
          createdAt?: string
          createdById?: string
          expiresAt?: string | null
          id?: string
          institutionId?: string | null
          isPublished?: boolean
          priority?: string
          publishedAt?: string | null
          targetRoles?: string[] | null
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignmentId: string
          attachments: string | null
          content: string | null
          createdAt: string
          feedback: string | null
          gradedAt: string | null
          id: string
          score: number | null
          status: Database["public"]["Enums"]["AssignmentStatus"]
          studentId: string
          submittedAt: string | null
          updatedAt: string
        }
        Insert: {
          assignmentId: string
          attachments?: string | null
          content?: string | null
          createdAt?: string
          feedback?: string | null
          gradedAt?: string | null
          id: string
          score?: number | null
          status?: Database["public"]["Enums"]["AssignmentStatus"]
          studentId: string
          submittedAt?: string | null
          updatedAt: string
        }
        Update: {
          assignmentId?: string
          attachments?: string | null
          content?: string | null
          createdAt?: string
          feedback?: string | null
          gradedAt?: string | null
          id?: string
          score?: number | null
          status?: Database["public"]["Enums"]["AssignmentStatus"]
          studentId?: string
          submittedAt?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignmentId_fkey"
            columns: ["assignmentId"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          attachments: string | null
          classSubjectId: string
          createdAt: string
          description: string
          dueDate: string
          id: string
          instructions: string | null
          maxScore: number | null
          teacherId: string
          title: string
          updatedAt: string
        }
        Insert: {
          attachments?: string | null
          classSubjectId: string
          createdAt?: string
          description: string
          dueDate: string
          id: string
          instructions?: string | null
          maxScore?: number | null
          teacherId: string
          title: string
          updatedAt: string
        }
        Update: {
          attachments?: string | null
          classSubjectId?: string
          createdAt?: string
          description?: string
          dueDate?: string
          id?: string
          instructions?: string | null
          maxScore?: number | null
          teacherId?: string
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_classSubjectId_fkey"
            columns: ["classSubjectId"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          classId: string
          classSubjectId: string
          createdAt: string
          date: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["AttendanceStatus"]
          studentId: string
          teacherId: string
          updatedAt: string
        }
        Insert: {
          classId: string
          classSubjectId: string
          createdAt?: string
          date: string
          id: string
          notes?: string | null
          status: Database["public"]["Enums"]["AttendanceStatus"]
          studentId: string
          teacherId: string
          updatedAt: string
        }
        Update: {
          classId?: string
          classSubjectId?: string
          createdAt?: string
          date?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["AttendanceStatus"]
          studentId?: string
          teacherId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_classSubjectId_fkey"
            columns: ["classSubjectId"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          color: string | null
          createdAt: string
          criteria: Json
          description: string
          icon: string | null
          id: string
          isActive: boolean
          name: string
          points: number
          rarity: Database["public"]["Enums"]["BadgeRarity"]
          type: Database["public"]["Enums"]["BadgeType"]
          updatedAt: string
        }
        Insert: {
          color?: string | null
          createdAt?: string
          criteria: Json
          description: string
          icon?: string | null
          id: string
          isActive?: boolean
          name: string
          points?: number
          rarity?: Database["public"]["Enums"]["BadgeRarity"]
          type: Database["public"]["Enums"]["BadgeType"]
          updatedAt: string
        }
        Update: {
          color?: string | null
          createdAt?: string
          criteria?: Json
          description?: string
          icon?: string | null
          id?: string
          isActive?: boolean
          name?: string
          points?: number
          rarity?: Database["public"]["Enums"]["BadgeRarity"]
          type?: Database["public"]["Enums"]["BadgeType"]
          updatedAt?: string
        }
        Relationships: []
      }
      class_enrollments: {
        Row: {
          classId: string
          createdAt: string
          enrollmentDate: string
          finalGrade: number | null
          id: string
          isActive: boolean
          status: Database["public"]["Enums"]["EnrollmentStatus"]
          studentId: string
          updatedAt: string
        }
        Insert: {
          classId: string
          createdAt?: string
          enrollmentDate?: string
          finalGrade?: number | null
          id: string
          isActive?: boolean
          status?: Database["public"]["Enums"]["EnrollmentStatus"]
          studentId: string
          updatedAt: string
        }
        Update: {
          classId?: string
          createdAt?: string
          enrollmentDate?: string
          finalGrade?: number | null
          id?: string
          isActive?: boolean
          status?: Database["public"]["Enums"]["EnrollmentStatus"]
          studentId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          classId: string
          classSubjectId: string
          createdAt: string
          dayOfWeek: Database["public"]["Enums"]["DayOfWeek"]
          endTime: string
          id: string
          room: string | null
          startTime: string
          updatedAt: string
        }
        Insert: {
          classId: string
          classSubjectId: string
          createdAt?: string
          dayOfWeek: Database["public"]["Enums"]["DayOfWeek"]
          endTime: string
          id: string
          room?: string | null
          startTime: string
          updatedAt: string
        }
        Update: {
          classId?: string
          classSubjectId?: string
          createdAt?: string
          dayOfWeek?: Database["public"]["Enums"]["DayOfWeek"]
          endTime?: string
          id?: string
          room?: string | null
          startTime?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_classSubjectId_fkey"
            columns: ["classSubjectId"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subject_requests: {
        Row: {
          classId: string
          createdAt: string
          id: string
          message: string | null
          rejectionReason: string | null
          reviewedAt: string | null
          reviewedById: string | null
          status: Database["public"]["Enums"]["RequestStatus"]
          subjectId: string
          teacherId: string
          updatedAt: string
        }
        Insert: {
          classId: string
          createdAt?: string
          id: string
          message?: string | null
          rejectionReason?: string | null
          reviewedAt?: string | null
          reviewedById?: string | null
          status?: Database["public"]["Enums"]["RequestStatus"]
          subjectId: string
          teacherId: string
          updatedAt: string
        }
        Update: {
          classId?: string
          createdAt?: string
          id?: string
          message?: string | null
          rejectionReason?: string | null
          reviewedAt?: string | null
          reviewedById?: string | null
          status?: Database["public"]["Enums"]["RequestStatus"]
          subjectId?: string
          teacherId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_subject_requests_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subject_requests_reviewedById_fkey"
            columns: ["reviewedById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subject_requests_subjectId_fkey"
            columns: ["subjectId"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subject_requests_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          classId: string
          createdAt: string
          id: string
          subjectId: string
          teacherId: string | null
          updatedAt: string
          weeklyHours: number | null
        }
        Insert: {
          classId: string
          createdAt?: string
          id: string
          subjectId: string
          teacherId?: string | null
          updatedAt: string
          weeklyHours?: number | null
        }
        Update: {
          classId?: string
          createdAt?: string
          id?: string
          subjectId?: string
          teacherId?: string | null
          updatedAt?: string
          weeklyHours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subjectId_fkey"
            columns: ["subjectId"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academicYearId: string
          courseId: string
          createdAt: string
          grade: string
          id: string
          institutionId: string
          isActive: boolean
          mainTeacherId: string | null
          maxStudents: number | null
          name: string
          section: string | null
          shift: string | null
          updatedAt: string
        }
        Insert: {
          academicYearId: string
          courseId: string
          createdAt?: string
          grade: string
          id: string
          institutionId: string
          isActive?: boolean
          mainTeacherId?: string | null
          maxStudents?: number | null
          name: string
          section?: string | null
          shift?: string | null
          updatedAt: string
        }
        Update: {
          academicYearId?: string
          courseId?: string
          createdAt?: string
          grade?: string
          id?: string
          institutionId?: string
          isActive?: boolean
          mainTeacherId?: string | null
          maxStudents?: number | null
          name?: string
          section?: string | null
          shift?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academicYearId_fkey"
            columns: ["academicYearId"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_courseId_fkey"
            columns: ["courseId"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_mainTeacherId_fkey"
            columns: ["mainTeacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string | null
          createdAt: string
          description: string | null
          duration: number | null
          id: string
          institutionId: string
          isActive: boolean
          level: string | null
          name: string
          updatedAt: string
        }
        Insert: {
          code?: string | null
          createdAt?: string
          description?: string | null
          duration?: number | null
          id: string
          institutionId: string
          isActive?: boolean
          level?: string | null
          name: string
          updatedAt: string
        }
        Update: {
          code?: string | null
          createdAt?: string
          description?: string | null
          duration?: number | null
          id?: string
          institutionId?: string
          isActive?: boolean
          level?: string | null
          name?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          academicYearId: string
          color: string | null
          createdAt: string
          description: string | null
          endDate: string | null
          id: string
          isAllDay: boolean
          location: string | null
          startDate: string
          title: string
          type: string
          updatedAt: string
        }
        Insert: {
          academicYearId: string
          color?: string | null
          createdAt?: string
          description?: string | null
          endDate?: string | null
          id: string
          isAllDay?: boolean
          location?: string | null
          startDate: string
          title: string
          type: string
          updatedAt: string
        }
        Update: {
          academicYearId?: string
          color?: string | null
          createdAt?: string
          description?: string | null
          endDate?: string | null
          id?: string
          isAllDay?: boolean
          location?: string | null
          startDate?: string
          title?: string
          type?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_academicYearId_fkey"
            columns: ["academicYearId"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_answers: {
        Row: {
          answeredAt: string
          attemptId: string
          examQuestionId: string
          id: string
          isCorrect: boolean | null
          pointsEarned: number
          selectedOption: number | null
        }
        Insert: {
          answeredAt?: string
          attemptId: string
          examQuestionId: string
          id: string
          isCorrect?: boolean | null
          pointsEarned?: number
          selectedOption?: number | null
        }
        Update: {
          answeredAt?: string
          attemptId?: string
          examQuestionId?: string
          id?: string
          isCorrect?: boolean | null
          pointsEarned?: number
          selectedOption?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_answers_attemptId_fkey"
            columns: ["attemptId"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_answers_examQuestionId_fkey"
            columns: ["examQuestionId"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_assignments: {
        Row: {
          assignedAt: string
          classId: string | null
          dueDate: string | null
          examId: string
          id: string
          studentId: string | null
        }
        Insert: {
          assignedAt?: string
          classId?: string | null
          dueDate?: string | null
          examId: string
          id: string
          studentId?: string | null
        }
        Update: {
          assignedAt?: string
          classId?: string | null
          dueDate?: string | null
          examId?: string
          id?: string
          studentId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_assignments_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_assignments_examId_fkey"
            columns: ["examId"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_assignments_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          createdAt: string
          endTime: string | null
          examId: string
          id: string
          percentage: number | null
          proficiency: number | null
          score: number | null
          startTime: string | null
          status: Database["public"]["Enums"]["AttemptStatus"]
          studentId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          endTime?: string | null
          examId: string
          id: string
          percentage?: number | null
          proficiency?: number | null
          score?: number | null
          startTime?: string | null
          status?: Database["public"]["Enums"]["AttemptStatus"]
          studentId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          endTime?: string | null
          examId?: string
          id?: string
          percentage?: number | null
          proficiency?: number | null
          score?: number | null
          startTime?: string | null
          status?: Database["public"]["Enums"]["AttemptStatus"]
          studentId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_examId_fkey"
            columns: ["examId"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          createdAt: string
          examId: string
          id: string
          orderNumber: number
          points: number
          questionId: string
        }
        Insert: {
          createdAt?: string
          examId: string
          id: string
          orderNumber: number
          points: number
          questionId: string
        }
        Update: {
          createdAt?: string
          examId?: string
          id?: string
          orderNumber?: number
          points?: number
          questionId?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_examId_fkey"
            columns: ["examId"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_questionId_fkey"
            columns: ["questionId"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          allowReview: boolean
          createdAt: string
          createdById: string
          description: string | null
          duration: number | null
          endDate: string | null
          gradeLevel: string | null
          id: string
          institutionId: string
          passingScore: number | null
          showResults: boolean
          shuffleOptions: boolean
          shuffleQuestions: boolean
          startDate: string | null
          status: Database["public"]["Enums"]["ExamStatus"]
          subjectId: string | null
          title: string
          totalPoints: number
          type: Database["public"]["Enums"]["ExamType"]
          updatedAt: string
        }
        Insert: {
          allowReview?: boolean
          createdAt?: string
          createdById: string
          description?: string | null
          duration?: number | null
          endDate?: string | null
          gradeLevel?: string | null
          id: string
          institutionId: string
          passingScore?: number | null
          showResults?: boolean
          shuffleOptions?: boolean
          shuffleQuestions?: boolean
          startDate?: string | null
          status?: Database["public"]["Enums"]["ExamStatus"]
          subjectId?: string | null
          title: string
          totalPoints?: number
          type: Database["public"]["Enums"]["ExamType"]
          updatedAt: string
        }
        Update: {
          allowReview?: boolean
          createdAt?: string
          createdById?: string
          description?: string | null
          duration?: number | null
          endDate?: string | null
          gradeLevel?: string | null
          id?: string
          institutionId?: string
          passingScore?: number | null
          showResults?: boolean
          shuffleOptions?: boolean
          shuffleQuestions?: boolean
          startDate?: string | null
          status?: Database["public"]["Enums"]["ExamStatus"]
          subjectId?: string | null
          title?: string
          totalPoints?: number
          type?: Database["public"]["Enums"]["ExamType"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_subjectId_fkey"
            columns: ["subjectId"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          academicPeriodId: string
          classSubjectId: string
          createdAt: string
          description: string | null
          examDate: string | null
          examType: string
          id: string
          observations: string | null
          publishedAt: string | null
          status: Database["public"]["Enums"]["GradeStatus"]
          studentId: string
          teacherId: string
          updatedAt: string
          value: number
          weight: number
        }
        Insert: {
          academicPeriodId: string
          classSubjectId: string
          createdAt?: string
          description?: string | null
          examDate?: string | null
          examType: string
          id: string
          observations?: string | null
          publishedAt?: string | null
          status?: Database["public"]["Enums"]["GradeStatus"]
          studentId: string
          teacherId: string
          updatedAt: string
          value: number
          weight?: number
        }
        Update: {
          academicPeriodId?: string
          classSubjectId?: string
          createdAt?: string
          description?: string | null
          examDate?: string | null
          examType?: string
          id?: string
          observations?: string | null
          publishedAt?: string | null
          status?: Database["public"]["Enums"]["GradeStatus"]
          studentId?: string
          teacherId?: string
          updatedAt?: string
          value?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_academicPeriodId_fkey"
            columns: ["academicPeriodId"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_classSubjectId_fkey"
            columns: ["classSubjectId"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      ideb_indicators: {
        Row: {
          approvalRate: number
          averageProficiency: number
          calculatedAt: string
          createdAt: string
          dropoutRate: number
          evaluatedStudents: number
          gradeLevel: string
          id: string
          idebScore: number
          institutionId: string
          mathProficiency: number | null
          portugueseProficiency: number | null
          repetitionRate: number
          totalStudents: number
          updatedAt: string
          year: number
        }
        Insert: {
          approvalRate: number
          averageProficiency: number
          calculatedAt?: string
          createdAt?: string
          dropoutRate: number
          evaluatedStudents: number
          gradeLevel: string
          id: string
          idebScore: number
          institutionId: string
          mathProficiency?: number | null
          portugueseProficiency?: number | null
          repetitionRate: number
          totalStudents: number
          updatedAt: string
          year: number
        }
        Update: {
          approvalRate?: number
          averageProficiency?: number
          calculatedAt?: string
          createdAt?: string
          dropoutRate?: number
          evaluatedStudents?: number
          gradeLevel?: string
          id?: string
          idebScore?: number
          institutionId?: string
          mathProficiency?: number | null
          portugueseProficiency?: number | null
          repetitionRate?: number
          totalStudents?: number
          updatedAt?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "ideb_indicators_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      ideb_targets: {
        Row: {
          createdAt: string
          gradeLevel: string
          id: string
          institutionId: string
          nationalTarget: number | null
          stateTarget: number | null
          target: number
          updatedAt: string
          year: number
        }
        Insert: {
          createdAt?: string
          gradeLevel: string
          id: string
          institutionId: string
          nationalTarget?: number | null
          stateTarget?: number | null
          target: number
          updatedAt: string
          year: number
        }
        Update: {
          createdAt?: string
          gradeLevel?: string
          id?: string
          institutionId?: string
          nationalTarget?: number | null
          stateTarget?: number | null
          target?: number
          updatedAt?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "ideb_targets_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_invites: {
        Row: {
          code: string
          createdAt: string
          createdById: string
          email: string | null
          expiresAt: string | null
          id: string
          institutionId: string
          isActive: boolean
          role: Database["public"]["Enums"]["UserRole"]
          updatedAt: string
          usedAt: string | null
          usedById: string | null
        }
        Insert: {
          code: string
          createdAt?: string
          createdById: string
          email?: string | null
          expiresAt?: string | null
          id: string
          institutionId: string
          isActive?: boolean
          role: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
          usedAt?: string | null
          usedById?: string | null
        }
        Update: {
          code?: string
          createdAt?: string
          createdById?: string
          email?: string | null
          expiresAt?: string | null
          id?: string
          institutionId?: string
          isActive?: boolean
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
          usedAt?: string | null
          usedById?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_invites_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_invites_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_invites_usedById_fkey"
            columns: ["usedById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          country: string
          createdAt: string
          email: string | null
          id: string
          isActive: boolean
          logo: string | null
          name: string
          phone: string | null
          slug: string
          state: string | null
          updatedAt: string
          zipCode: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          country?: string
          createdAt?: string
          email?: string | null
          id: string
          isActive?: boolean
          logo?: string | null
          name: string
          phone?: string | null
          slug: string
          state?: string | null
          updatedAt: string
          zipCode?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          country?: string
          createdAt?: string
          email?: string | null
          id?: string
          isActive?: boolean
          logo?: string | null
          name?: string
          phone?: string | null
          slug?: string
          state?: string | null
          updatedAt?: string
          zipCode?: string | null
        }
        Relationships: []
      }
      lesson_contents: {
        Row: {
          activities: string | null
          classSubjectId: string
          createdAt: string
          date: string
          description: string
          homework: string | null
          id: string
          objectives: string | null
          observations: string | null
          teacherId: string
          title: string
          updatedAt: string
        }
        Insert: {
          activities?: string | null
          classSubjectId: string
          createdAt?: string
          date: string
          description: string
          homework?: string | null
          id: string
          objectives?: string | null
          observations?: string | null
          teacherId: string
          title: string
          updatedAt: string
        }
        Update: {
          activities?: string | null
          classSubjectId?: string
          createdAt?: string
          date?: string
          description?: string
          homework?: string | null
          id?: string
          objectives?: string | null
          observations?: string | null
          teacherId?: string
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_contents_classSubjectId_fkey"
            columns: ["classSubjectId"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_contents_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          academicPeriodId: string
          approvedAt: string | null
          approvedById: string | null
          classSubjectId: string
          createdAt: string
          createdById: string
          description: string
          endDate: string
          evaluation: string | null
          id: string
          methodology: string | null
          objectives: string
          rejectionReason: string | null
          resources: string | null
          startDate: string
          status: Database["public"]["Enums"]["LessonPlanStatus"]
          submittedAt: string | null
          teacherId: string
          title: string
          updatedAt: string
        }
        Insert: {
          academicPeriodId: string
          approvedAt?: string | null
          approvedById?: string | null
          classSubjectId: string
          createdAt?: string
          createdById: string
          description: string
          endDate: string
          evaluation?: string | null
          id: string
          methodology?: string | null
          objectives: string
          rejectionReason?: string | null
          resources?: string | null
          startDate: string
          status?: Database["public"]["Enums"]["LessonPlanStatus"]
          submittedAt?: string | null
          teacherId: string
          title: string
          updatedAt: string
        }
        Update: {
          academicPeriodId?: string
          approvedAt?: string | null
          approvedById?: string | null
          classSubjectId?: string
          createdAt?: string
          createdById?: string
          description?: string
          endDate?: string
          evaluation?: string | null
          id?: string
          methodology?: string | null
          objectives?: string
          rejectionReason?: string | null
          resources?: string | null
          startDate?: string
          status?: Database["public"]["Enums"]["LessonPlanStatus"]
          submittedAt?: string | null
          teacherId?: string
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_academicPeriodId_fkey"
            columns: ["academicPeriodId"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_approvedById_fkey"
            columns: ["approvedById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_classSubjectId_fkey"
            columns: ["classSubjectId"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          createdAt: string
          data: string | null
          id: string
          message: string
          parentId: string | null
          readAt: string | null
          sentAt: string
          sentById: string | null
          status: Database["public"]["Enums"]["NotificationStatus"]
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          userId: string
        }
        Insert: {
          createdAt?: string
          data?: string | null
          id: string
          message: string
          parentId?: string | null
          readAt?: string | null
          sentAt?: string
          sentById?: string | null
          status?: Database["public"]["Enums"]["NotificationStatus"]
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          userId: string
        }
        Update: {
          createdAt?: string
          data?: string | null
          id?: string
          message?: string
          parentId?: string | null
          readAt?: string | null
          sentAt?: string
          sentById?: string | null
          status?: Database["public"]["Enums"]["NotificationStatus"]
          title?: string
          type?: Database["public"]["Enums"]["NotificationType"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_parentId_fkey"
            columns: ["parentId"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sentById_fkey"
            columns: ["sentById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          createdAt: string
          id: string
          isActive: boolean
          occupation: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id: string
          isActive?: boolean
          occupation?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          isActive?: boolean
          occupation?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "parents_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          createdAt: string
          description: string
          id: string
          metadata: Json | null
          points: number
          type: string
          userId: string
        }
        Insert: {
          createdAt?: string
          description: string
          id: string
          metadata?: Json | null
          points: number
          type: string
          userId: string
        }
        Update: {
          createdAt?: string
          description?: string
          id?: string
          metadata?: Json | null
          points?: number
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      question_categories: {
        Row: {
          color: string | null
          createdAt: string
          description: string | null
          id: string
          institutionId: string
          isActive: boolean
          name: string
          subjectId: string | null
          updatedAt: string
        }
        Insert: {
          color?: string | null
          createdAt?: string
          description?: string | null
          id: string
          institutionId: string
          isActive?: boolean
          name: string
          subjectId?: string | null
          updatedAt: string
        }
        Update: {
          color?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          institutionId?: string
          isActive?: boolean
          name?: string
          subjectId?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_categories_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_categories_subjectId_fkey"
            columns: ["subjectId"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          createdAt: string
          id: string
          image: string | null
          optionLetter: string
          orderNumber: number
          questionId: string
          text: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id: string
          image?: string | null
          optionLetter: string
          orderNumber: number
          questionId: string
          text: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: string
          image?: string | null
          optionLetter?: string
          orderNumber?: number
          questionId?: string
          text?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_questionId_fkey"
            columns: ["questionId"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answerKey: string | null
          categoryId: string | null
          correctAnswer: string | null
          createdAt: string
          createdById: string
          difficulty: Database["public"]["Enums"]["QuestionDifficulty"]
          explanation: string | null
          id: string
          images: string | null
          institutionId: string | null
          isActive: boolean
          isPublic: boolean
          points: number
          saebDescriptorId: string | null
          statement: string
          subjectId: string | null
          tags: string[] | null
          timesUsed: number
          title: string
          type: Database["public"]["Enums"]["QuestionType"]
          updatedAt: string
        }
        Insert: {
          answerKey?: string | null
          categoryId?: string | null
          correctAnswer?: string | null
          createdAt?: string
          createdById: string
          difficulty?: Database["public"]["Enums"]["QuestionDifficulty"]
          explanation?: string | null
          id: string
          images?: string | null
          institutionId?: string | null
          isActive?: boolean
          isPublic?: boolean
          points?: number
          saebDescriptorId?: string | null
          statement: string
          subjectId?: string | null
          tags?: string[] | null
          timesUsed?: number
          title: string
          type: Database["public"]["Enums"]["QuestionType"]
          updatedAt: string
        }
        Update: {
          answerKey?: string | null
          categoryId?: string | null
          correctAnswer?: string | null
          createdAt?: string
          createdById?: string
          difficulty?: Database["public"]["Enums"]["QuestionDifficulty"]
          explanation?: string | null
          id?: string
          images?: string | null
          institutionId?: string | null
          isActive?: boolean
          isPublic?: boolean
          points?: number
          saebDescriptorId?: string | null
          statement?: string
          subjectId?: string | null
          tags?: string[] | null
          timesUsed?: number
          title?: string
          type?: Database["public"]["Enums"]["QuestionType"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "question_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_saebDescriptorId_fkey"
            columns: ["saebDescriptorId"]
            isOneToOne: false
            referencedRelation: "saeb_descriptors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subjectId_fkey"
            columns: ["subjectId"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      rankings: {
        Row: {
          activityPoints: number
          attendancePoints: number
          classId: string | null
          createdAt: string
          examPoints: number
          gradePoints: number
          id: string
          institutionId: string | null
          period: Database["public"]["Enums"]["RankingPeriod"]
          periodEnd: string
          periodStart: string
          previousRank: number | null
          rank: number
          streakBonus: number
          totalPoints: number
          updatedAt: string
          userId: string
        }
        Insert: {
          activityPoints?: number
          attendancePoints?: number
          classId?: string | null
          createdAt?: string
          examPoints?: number
          gradePoints?: number
          id: string
          institutionId?: string | null
          period: Database["public"]["Enums"]["RankingPeriod"]
          periodEnd: string
          periodStart: string
          previousRank?: number | null
          rank: number
          streakBonus?: number
          totalPoints?: number
          updatedAt: string
          userId: string
        }
        Update: {
          activityPoints?: number
          attendancePoints?: number
          classId?: string | null
          createdAt?: string
          examPoints?: number
          gradePoints?: number
          id?: string
          institutionId?: string | null
          period?: Database["public"]["Enums"]["RankingPeriod"]
          periodEnd?: string
          periodStart?: string
          previousRank?: number | null
          rank?: number
          streakBonus?: number
          totalPoints?: number
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "rankings_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rankings_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rankings_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saeb_descriptors: {
        Row: {
          code: string
          createdAt: string
          description: string
          gradeLevel: string
          id: string
          skill: string
          subject: string
          updatedAt: string
        }
        Insert: {
          code: string
          createdAt?: string
          description: string
          gradeLevel: string
          id: string
          skill: string
          subject: string
          updatedAt: string
        }
        Update: {
          code?: string
          createdAt?: string
          description?: string
          gradeLevel?: string
          id?: string
          skill?: string
          subject?: string
          updatedAt?: string
        }
        Relationships: []
      }
      student_observations: {
        Row: {
          createdAt: string
          date: string
          description: string
          id: string
          isPrivate: boolean
          studentId: string
          teacherId: string
          title: string
          type: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          date?: string
          description: string
          id: string
          isPrivate?: boolean
          studentId: string
          teacherId: string
          title: string
          type?: string | null
          updatedAt: string
        }
        Update: {
          createdAt?: string
          date?: string
          description?: string
          id?: string
          isPrivate?: boolean
          studentId?: string
          teacherId?: string
          title?: string
          type?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_observations_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_observations_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_parents: {
        Row: {
          createdAt: string
          id: string
          isPrimary: boolean
          parentId: string
          relationship: string
          studentId: string
        }
        Insert: {
          createdAt?: string
          id: string
          isPrimary?: boolean
          parentId: string
          relationship: string
          studentId: string
        }
        Update: {
          createdAt?: string
          id?: string
          isPrimary?: boolean
          parentId?: string
          relationship?: string
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parentId_fkey"
            columns: ["parentId"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          createdAt: string
          enrollmentDate: string
          enrollmentNumber: string | null
          id: string
          isActive: boolean
          registrationNumber: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          enrollmentDate?: string
          enrollmentNumber?: string | null
          id: string
          isActive?: boolean
          registrationNumber: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          enrollmentDate?: string
          enrollmentNumber?: string | null
          id?: string
          isActive?: boolean
          registrationNumber?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          color: string | null
          createdAt: string
          description: string | null
          id: string
          institutionId: string
          isActive: boolean
          name: string
          updatedAt: string
        }
        Insert: {
          code?: string | null
          color?: string | null
          createdAt?: string
          description?: string | null
          id: string
          institutionId: string
          isActive?: boolean
          name: string
          updatedAt: string
        }
        Update: {
          code?: string | null
          color?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          institutionId?: string
          isActive?: boolean
          name?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_attendances: {
        Row: {
          checkInTime: string
          classId: string
          classSubjectId: string
          createdAt: string
          date: string
          id: string
          notes: string | null
          teacherId: string
          updatedAt: string
        }
        Insert: {
          checkInTime?: string
          classId: string
          classSubjectId: string
          createdAt?: string
          date: string
          id: string
          notes?: string | null
          teacherId: string
          updatedAt: string
        }
        Update: {
          checkInTime?: string
          classId?: string
          classSubjectId?: string
          createdAt?: string
          date?: string
          id?: string
          notes?: string | null
          teacherId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_attendances_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_attendances_classSubjectId_fkey"
            columns: ["classSubjectId"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_attendances_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          createdAt: string
          id: string
          subjectId: string
          teacherId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id: string
          subjectId: string
          teacherId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: string
          subjectId?: string
          teacherId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subjectId_fkey"
            columns: ["subjectId"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          createdAt: string
          degree: string | null
          hireDate: string | null
          id: string
          isActive: boolean
          registrationNumber: string | null
          specialization: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          degree?: string | null
          hireDate?: string | null
          id: string
          isActive?: boolean
          registrationNumber?: string | null
          specialization?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          degree?: string | null
          hireDate?: string | null
          id?: string
          isActive?: boolean
          registrationNumber?: string | null
          specialization?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_institutions: {
        Row: {
          createdAt: string
          id: string
          institutionId: string
          isActive: boolean
          isPrimary: boolean
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id: string
          institutionId: string
          isActive?: boolean
          isPrimary?: boolean
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          institutionId?: string
          isActive?: boolean
          isPrimary?: boolean
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_institutions_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_institutions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          auth_user_id: string | null
          avatar: string | null
          birthDate: string | null
          city: string | null
          cpf: string | null
          createdAt: string
          email: string
          emailVerified: boolean
          firstName: string
          gender: Database["public"]["Enums"]["Gender"] | null
          id: string
          institutionId: string
          isActive: boolean
          lastName: string
          name: string
          password: string | null
          phone: string | null
          requestedProfileType: string | null
          role: Database["public"]["Enums"]["UserRole"]
          state: string | null
          updatedAt: string
          zipCode: string | null
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          avatar?: string | null
          birthDate?: string | null
          city?: string | null
          cpf?: string | null
          createdAt?: string
          email: string
          emailVerified?: boolean
          firstName: string
          gender?: Database["public"]["Enums"]["Gender"] | null
          id: string
          institutionId: string
          isActive?: boolean
          lastName: string
          name: string
          password?: string | null
          phone?: string | null
          requestedProfileType?: string | null
          role: Database["public"]["Enums"]["UserRole"]
          state?: string | null
          updatedAt: string
          zipCode?: string | null
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          avatar?: string | null
          birthDate?: string | null
          city?: string | null
          cpf?: string | null
          createdAt?: string
          email?: string
          emailVerified?: boolean
          firstName?: string
          gender?: Database["public"]["Enums"]["Gender"] | null
          id?: string
          institutionId?: string
          isActive?: boolean
          lastName?: string
          name?: string
          password?: string | null
          phone?: string | null
          requestedProfileType?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          state?: string | null
          updatedAt?: string
          zipCode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_institutionId_fkey"
            columns: ["institutionId"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_institution: { Args: { inst_id: string }; Returns: boolean }
      create_profile: {
        Args: {
          cpf?: string
          first_name: string
          institution_id: string
          last_name: string
          phone?: string
          requested_profile_type?: string
          role: Database["public"]["Enums"]["UserRole"]
        }
        Returns: {
          address: string | null
          auth_user_id: string | null
          avatar: string | null
          birthDate: string | null
          city: string | null
          cpf: string | null
          createdAt: string
          email: string
          emailVerified: boolean
          firstName: string
          gender: Database["public"]["Enums"]["Gender"] | null
          id: string
          institutionId: string
          isActive: boolean
          lastName: string
          name: string
          password: string | null
          phone: string | null
          requestedProfileType: string | null
          role: Database["public"]["Enums"]["UserRole"]
          state: string | null
          updatedAt: string
          zipCode: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_app_user_id: { Args: never; Returns: string }
      current_institution_id: { Args: never; Returns: string }
      current_parent_id: { Args: never; Returns: string }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["UserRole"]
      }
      current_student_id: { Args: never; Returns: string }
      current_teacher_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      AcademicPeriodType:
        | "SEMESTER"
        | "TRIMESTER"
        | "QUARTER"
        | "BIMESTER"
        | "ANNUAL"
      AssignmentStatus: "PENDING" | "SUBMITTED" | "LATE" | "GRADED" | "RETURNED"
      AttemptStatus: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED"
      AttendanceStatus: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
      BadgeRarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY"
      BadgeType:
        | "GRADE"
        | "ATTENDANCE"
        | "STREAK"
        | "RANKING"
        | "ACHIEVEMENT"
        | "SPECIAL"
      DayOfWeek:
        | "MONDAY"
        | "TUESDAY"
        | "WEDNESDAY"
        | "THURSDAY"
        | "FRIDAY"
        | "SATURDAY"
        | "SUNDAY"
      EnrollmentStatus:
        | "ENROLLED"
        | "APPROVED"
        | "FAILED"
        | "DROPPED_OUT"
        | "TRANSFERRED"
      ExamStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
      ExamType: "SAEB" | "DIAGNOSTIC" | "FORMATIVE" | "SUMMATIVE" | "CUSTOM"
      Gender: "MALE" | "FEMALE" | "OTHER" | "NOT_INFORMED"
      GradeStatus: "PENDING" | "PUBLISHED" | "FINAL"
      LessonPlanStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
      NotificationStatus: "SENT" | "READ" | "UNREAD"
      NotificationType:
        | "ABSENCE"
        | "LOW_GRADE"
        | "GENERAL_ANNOUNCEMENT"
        | "ASSIGNMENT_DUE"
        | "EVENT_REMINDER"
        | "MEETING"
        | "BEHAVIOR_ALERT"
        | "PENDING_APPROVAL"
        | "USER_APPROVED"
        | "GRADE_PUBLISHED"
        | "NEW_ASSIGNMENT"
        | "SYSTEM"
      QuestionDifficulty:
        | "VERY_EASY"
        | "EASY"
        | "MEDIUM"
        | "HARD"
        | "VERY_HARD"
        | "EXPERT"
      QuestionType:
        | "MULTIPLE_CHOICE"
        | "OPEN_ENDED"
        | "TRUE_FALSE"
        | "SHORT_ANSWER"
        | "ESSAY"
        | "FILL_IN_BLANK"
      RankingPeriod: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "ALL_TIME"
      RequestStatus: "PENDING" | "APPROVED" | "REJECTED"
      UserRole:
        | "SUPER_ADMIN"
        | "INSTITUTION_ADMIN"
        | "COORDINATOR"
        | "TEACHER"
        | "STUDENT"
        | "PARENT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      AcademicPeriodType: [
        "SEMESTER",
        "TRIMESTER",
        "QUARTER",
        "BIMESTER",
        "ANNUAL",
      ],
      AssignmentStatus: ["PENDING", "SUBMITTED", "LATE", "GRADED", "RETURNED"],
      AttemptStatus: ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "GRADED"],
      AttendanceStatus: ["PRESENT", "ABSENT", "LATE", "EXCUSED"],
      BadgeRarity: ["COMMON", "RARE", "EPIC", "LEGENDARY"],
      BadgeType: [
        "GRADE",
        "ATTENDANCE",
        "STREAK",
        "RANKING",
        "ACHIEVEMENT",
        "SPECIAL",
      ],
      DayOfWeek: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
      EnrollmentStatus: [
        "ENROLLED",
        "APPROVED",
        "FAILED",
        "DROPPED_OUT",
        "TRANSFERRED",
      ],
      ExamStatus: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      ExamType: ["SAEB", "DIAGNOSTIC", "FORMATIVE", "SUMMATIVE", "CUSTOM"],
      Gender: ["MALE", "FEMALE", "OTHER", "NOT_INFORMED"],
      GradeStatus: ["PENDING", "PUBLISHED", "FINAL"],
      LessonPlanStatus: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"],
      NotificationStatus: ["SENT", "READ", "UNREAD"],
      NotificationType: [
        "ABSENCE",
        "LOW_GRADE",
        "GENERAL_ANNOUNCEMENT",
        "ASSIGNMENT_DUE",
        "EVENT_REMINDER",
        "MEETING",
        "BEHAVIOR_ALERT",
        "PENDING_APPROVAL",
        "USER_APPROVED",
        "GRADE_PUBLISHED",
        "NEW_ASSIGNMENT",
        "SYSTEM",
      ],
      QuestionDifficulty: [
        "VERY_EASY",
        "EASY",
        "MEDIUM",
        "HARD",
        "VERY_HARD",
        "EXPERT",
      ],
      QuestionType: [
        "MULTIPLE_CHOICE",
        "OPEN_ENDED",
        "TRUE_FALSE",
        "SHORT_ANSWER",
        "ESSAY",
        "FILL_IN_BLANK",
      ],
      RankingPeriod: ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "ALL_TIME"],
      RequestStatus: ["PENDING", "APPROVED", "REJECTED"],
      UserRole: [
        "SUPER_ADMIN",
        "INSTITUTION_ADMIN",
        "COORDINATOR",
        "TEACHER",
        "STUDENT",
        "PARENT",
      ],
    },
  },
} as const
