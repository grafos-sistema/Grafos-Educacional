import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getCoordinatorDashboard(currentUser: any) {
    // Only coordinators, institution admins and super admins can access
    if (
      ![UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.COORDINATOR].includes(
        currentUser.role,
      )
    ) {
      throw new ForbiddenException('Access denied');
    }

    const institutionId = currentUser.institutionId;

    // Get total counts
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      activeEnrollments,
      totalSubjectsCount,
    ] = await Promise.all([
      this.prisma.student.count({
        where: {
          user: {
            institutionId: currentUser.role === UserRole.SUPER_ADMIN ? undefined : institutionId,
          },
        },
      }),
      this.prisma.teacher.count({
        where: {
          user: {
            institutionId: currentUser.role === UserRole.SUPER_ADMIN ? undefined : institutionId,
          },
        },
      }),
      this.prisma.class.count({
        where: {
          institutionId: currentUser.role === UserRole.SUPER_ADMIN ? undefined : institutionId,
        },
      }),
      this.prisma.subject.count(),
      this.prisma.classEnrollment.count({
        where: {
          isActive: true,
          class: {
            institutionId: currentUser.role === UserRole.SUPER_ADMIN ? undefined : institutionId,
          },
        },
      }),
      this.prisma.subject.count({
        where: {
          institutionId: currentUser.role === UserRole.SUPER_ADMIN ? undefined : institutionId,
        },
      }),
    ]);

    // Get recent grades statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentGrades = await this.prisma.grade.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        classSubject: {
          class: {
            institutionId: currentUser.role === UserRole.SUPER_ADMIN ? undefined : institutionId,
          },
        },
      },
    });

    const averageGrade =
      recentGrades.length > 0
        ? (recentGrades.reduce((sum, g) => sum + g.value, 0) / recentGrades.length).toFixed(2)
        : 0;

    // Get attendance statistics (last 30 days)
    const recentAttendances = await this.prisma.attendance.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
        class: {
          institutionId: currentUser.role === UserRole.SUPER_ADMIN ? undefined : institutionId,
        },
      },
    });

    const attendanceRate =
      recentAttendances.length > 0
        ? (
            (recentAttendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length /
              recentAttendances.length) *
            100
          ).toFixed(2)
        : 0;

    // Get recent announcements
    const recentAnnouncements = await this.prisma.announcement.findMany({
      where: {
        institutionId: currentUser.role === UserRole.SUPER_ADMIN ? undefined : institutionId,
        isPublished: true,
      },
      take: 5,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        priority: true,
        publishedAt: true,
      },
    });

    // Get upcoming events
    const upcomingEvents = await this.prisma.event.findMany({
      where: {
        academicYear: {
          institutionId: currentUser.role === UserRole.SUPER_ADMIN ? undefined : institutionId,
        },
        startDate: { gte: new Date() },
      },
      take: 5,
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        startDate: true,
        endDate: true,
      },
    });

    // Get classes with low attendance rate
    const classesWithLowAttendance = await this.getClassesWithLowAttendance(
      institutionId,
      currentUser.role,
    );

    // Get students with low grades
    const studentsWithLowGrades = await this.getStudentsWithLowGrades(
      institutionId,
      currentUser.role,
    );

    return {
      overview: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects: totalSubjectsCount,
        activeEnrollments,
      },
      performance: {
        averageGrade: parseFloat(averageGrade as string),
        attendanceRate: parseFloat(attendanceRate as string),
        totalGradesLast30Days: recentGrades.length,
        totalAttendancesLast30Days: recentAttendances.length,
      },
      alerts: {
        classesWithLowAttendance,
        studentsWithLowGrades,
      },
      recent: {
        announcements: recentAnnouncements,
        upcomingEvents,
      },
    };
  }

  async getTeacherDashboard(currentUser: any) {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Access denied');
    }

    // Get teacher profile
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: currentUser.id },
      include: {
        classSubjects: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new ForbiddenException('Teacher profile not found');
    }

    // Get unique classes and subjects
    const classIds = Array.from(new Set(teacher.classSubjects.map(sc => sc.classId)));
    const subjectIds = Array.from(new Set(teacher.classSubjects.map(sc => sc.subjectId)));

    // Get total students across all classes
    const totalStudents = await this.prisma.classEnrollment.count({
      where: {
        classId: { in: classIds },
        isActive: true,
      },
    });

    // Get recent grades posted by this teacher
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentGrades = await this.prisma.grade.findMany({
      where: {
        classSubject: {
          classId: { in: classIds },
          subjectId: { in: subjectIds },
        },
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Get pending assignments (not graded yet)
    const pendingAssignments = await this.prisma.assignmentSubmission.count({
      where: {
        assignment: {
          teacherId: teacher.id,
        },
        score: null,
      },
    });

    // Get today's classes (simplified - just count)
    const todayClasses = teacher.classSubjects.length;

    // Get recent lesson contents
    const recentLessonContents = await this.prisma.lessonContent.findMany({
      where: {
        teacherId: teacher.id,
      },
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        classSubject: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    // Get upcoming assignments
    const upcomingAssignments = await this.prisma.assignment.findMany({
      where: {
        teacherId: teacher.id,
        dueDate: { gte: new Date() },
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
      include: {
        classSubject: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    // Get students with low attendance in teacher's classes
    const studentsWithLowAttendance = await this.getStudentsWithLowAttendanceInClasses(classIds);

    return {
      overview: {
        totalClasses: classIds.length,
        totalSubjects: subjectIds.length,
        totalStudents,
        todayClasses,
      },
      activity: {
        gradesPostedLast30Days: recentGrades.length,
        pendingAssignments,
        recentLessonContents: recentLessonContents.length,
      },
      alerts: {
        pendingAssignments,
        studentsWithLowAttendance,
      },
      schedule: {
        classes: teacher.classSubjects.map(sc => ({
          className: sc.class.name,
          subjectName: sc.subject.name,
        })),
        upcomingAssignments: upcomingAssignments.map(a => ({
          id: a.id,
          title: a.title,
          className: a.classSubject.class.name,
          subjectName: a.classSubject.subject.name,
          dueDate: a.dueDate,
        })),
      },
      recentContent: recentLessonContents.map(lc => ({
        id: lc.id,
        title: lc.title,
        className: lc.classSubject.class.name,
        subjectName: lc.classSubject.subject.name,
        date: lc.date,
      })),
    };
  }

  async getParentDashboard(currentUser: any) {
    if (currentUser.role !== UserRole.PARENT) {
      throw new ForbiddenException('Access denied');
    }

    // Get parent profile with children
    const parent = await this.prisma.parent.findUnique({
      where: { userId: currentUser.id },
      include: {
        children: {
          include: {
            student: {
              include: {
                user: true,
                classEnrollments: {
                  where: { isActive: true },
                  include: {
                    class: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent || parent.children.length === 0) {
      return {
        overview: {
          totalChildren: 0,
        },
        children: [],
      };
    }

    const studentIds = parent.children.map(c => c.student.id);

    // Get recent grades for all children
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentGrades = await this.prisma.grade.findMany({
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        classSubject: {
          include: {
            subject: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent observations (non-private only)
    const recentObservations = await this.prisma.studentObservation.findMany({
      where: {
        studentId: { in: studentIds },
        isPrivate: false,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 5,
    });

    // Get upcoming assignments for children
    const classIds = parent.children.flatMap(c =>
      c.student.classEnrollments.map(e => e.classId)
    );

    const upcomingAssignments = await this.prisma.assignment.findMany({
      where: {
        classSubject: {
          classId: {
            in: classIds,
          },
        },
        dueDate: { gte: new Date() },
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
      include: {
        classSubject: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    // Get unread notifications
    const unreadNotifications = await this.prisma.notification.count({
      where: {
        parentId: parent.id,
        status: 'UNREAD',
      },
    });

    // Calculate statistics for each child
    const childrenData = await Promise.all(
      parent.children.map(async ({ student }) => {
        // Get grades for this student
        const studentGrades = await this.prisma.grade.findMany({
          where: {
            studentId: student.id,
          },
        });

        const averageGrade =
          studentGrades.length > 0
            ? (studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length).toFixed(
                2,
              )
            : 0;

        // Get attendance for this student
        const attendances = await this.prisma.attendance.findMany({
          where: {
            studentId: student.id,
          },
        });

        const attendanceRate =
          attendances.length > 0
            ? (
                (attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length /
                  attendances.length) *
                100
              ).toFixed(2)
            : 0;

        return {
          id: student.id,
          name: student.user.name,
          currentClass: student.classEnrollments[0]?.class.name || 'N/A',
          averageGrade: parseFloat(averageGrade as string),
          attendanceRate: parseFloat(attendanceRate as string),
          recentGradesCount: studentGrades.filter(g => g.createdAt >= thirtyDaysAgo).length,
        };
      }),
    );

    return {
      overview: {
        totalChildren: parent.children.length,
        unreadNotifications,
      },
      children: childrenData,
      recentActivity: {
        grades: recentGrades.map(g => ({
          studentName: g.student.user.name,
          subjectName: g.classSubject?.subject?.name || 'N/A',
          examType: g.examType,
          score: g.value,
          date: g.createdAt,
        })),
        observations: recentObservations.map(o => ({
          studentName: o.student.user.name,
          title: o.title,
          type: o.type,
          observedBy: o.teacher.user.name,
          date: o.date,
        })),
      },
      upcomingAssignments: upcomingAssignments.map(a => ({
        title: a.title,
        className: a.classSubject.class.name,
        subjectName: a.classSubject.subject.name,
        dueDate: a.dueDate,
      })),
    };
  }

  async getStatistics(currentUser: any) {
    const institutionId =
      currentUser.role === UserRole.SUPER_ADMIN ? undefined : currentUser.institutionId;

    const [totalUsers, totalInstitutions, totalQuestions, totalActivities] = await Promise.all([
      this.prisma.user.count({
        where: { institutionId },
      }),
      currentUser.role === UserRole.SUPER_ADMIN ? this.prisma.institution.count() : 1,
      this.prisma.question.count(),
      this.prisma.activity.count({
        where: {
          class: {
            institutionId,
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalInstitutions,
      totalQuestions,
      totalActivities,
    };
  }

  private async getClassesWithLowAttendance(institutionId: string, role: UserRole) {
    // Simplified version - get classes and calculate attendance
    const classes = await this.prisma.class.findMany({
      where: {
        institutionId: role === UserRole.SUPER_ADMIN ? undefined : institutionId,
      },
      take: 5,
    });

    // This is a simplified version - in production you'd want more complex queries
    return classes.map(c => ({
      classId: c.id,
      className: c.name,
      attendanceRate: 85, // Placeholder - would calculate from actual data
    }));
  }

  private async getStudentsWithLowGrades(institutionId: string, role: UserRole) {
    const grades = await this.prisma.grade.findMany({
      where: {
        value: { lt: 6 },
        classSubject: {
          class: {
            institutionId: role === UserRole.SUPER_ADMIN ? undefined : institutionId,
          },
        },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        classSubject: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { value: 'asc' },
      take: 10,
    });

    return grades.map(g => ({
      studentName: g.student.user.name,
      subjectName: g.classSubject?.subject?.name || 'N/A',
      score: g.value,
    }));
  }

  private async getStudentsWithLowAttendanceInClasses(classIds: string[]) {
    // Simplified version
    const attendances = await this.prisma.attendance.findMany({
      where: {
        classId: { in: classIds },
        status: 'ABSENT',
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      take: 5,
    });

    return attendances.map(a => ({
      studentName: a.student.user.name,
      absenceCount: 1, // Placeholder
    }));
  }
}
