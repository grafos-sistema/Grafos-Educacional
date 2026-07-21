import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';
import { GradesReportQueryDto } from './dto/grades-report-query.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getAttendanceReport(query: AttendanceReportQueryDto, currentUser: any) {
    const { classId, subjectId, academicPeriodId, startDate, endDate } = query;

    // Build where clause
    const where: any = {};

    if (classId) {
      where.classId = classId;
    }

    if (subjectId) {
      where.classSubject = {
        subjectId,
      };
    }

    if (academicPeriodId) {
      where.academicPeriodId = academicPeriodId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Filter by institution if not SUPER_ADMIN
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.class = {
        ...where.class,
        institutionId: currentUser.institutionId,
      };
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        class: true,
        classSubject: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate statistics
    const totalRecords = attendances.length;
    const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
    const absentCount = attendances.filter(a => a.status === 'ABSENT').length;
    const excusedCount = attendances.filter(a => a.status === 'EXCUSED').length;
    const lateCount = attendances.filter(a => a.status === 'LATE').length;

    // Group by student
    const byStudent = attendances.reduce((acc, attendance) => {
      const studentId = attendance.student.id;
      const studentName = `${attendance.student.user.firstName} ${attendance.student.user.lastName}`;

      if (!acc[studentId]) {
        acc[studentId] = {
          studentId,
          studentName,
          total: 0,
          present: 0,
          absent: 0,
          excused: 0,
          late: 0,
          attendanceRate: 0,
        };
      }

      acc[studentId].total++;
      if (attendance.status === 'PRESENT') acc[studentId].present++;
      if (attendance.status === 'ABSENT') acc[studentId].absent++;
      if (attendance.status === 'EXCUSED') acc[studentId].excused++;
      if (attendance.status === 'LATE') acc[studentId].late++;

      return acc;
    }, {} as Record<string, any>);

    // Calculate attendance rate for each student
    Object.values(byStudent).forEach((student: any) => {
      student.attendanceRate = ((student.present + student.late) / student.total * 100).toFixed(2);
    });

    return {
      summary: {
        totalRecords,
        presentCount,
        absentCount,
        excusedCount,
        lateCount,
        attendanceRate: totalRecords > 0 ? ((presentCount + lateCount) / totalRecords * 100).toFixed(2) : 0,
      },
      byStudent: Object.values(byStudent),
      details: attendances,
    };
  }

  async getGradesReport(query: GradesReportQueryDto, currentUser: any) {
    const { classId, subjectId, academicPeriodId } = query;

    // Build where clause
    const where: any = {};

    if (classId) {
      where.classSubject = {
        classId,
      };
    }

    if (subjectId) {
      if (where.classSubject) {
        where.classSubject.subjectId = subjectId;
      } else {
        where.classSubject = {
          subjectId,
        };
      }
    }

    if (academicPeriodId) {
      where.academicPeriodId = academicPeriodId;
    }

    // Filter by institution if not SUPER_ADMIN
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (where.classSubject) {
        where.classSubject.class = {
          institutionId: currentUser.institutionId,
        };
      } else {
        where.classSubject = {
          class: {
            institutionId: currentUser.institutionId,
          },
        };
      }
    }

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        classSubject: {
          include: {
            class: true,
            subject: true,
          },
        },
        academicPeriod: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const totalGrades = grades.length;
    const totalScore = grades.reduce((sum, grade) => sum + grade.value, 0);
    const averageScore = totalGrades > 0 ? (totalScore / totalGrades).toFixed(2) : 0;

    // Group by student
    const byStudent = grades.reduce((acc, grade) => {
      const studentId = grade.student.id;
      const studentName = `${grade.student.user.firstName} ${grade.student.user.lastName}`;

      if (!acc[studentId]) {
        acc[studentId] = {
          studentId,
          studentName,
          grades: [],
          totalScore: 0,
          gradeCount: 0,
          average: 0,
        };
      }

      acc[studentId].grades.push({
        examType: grade.examType,
        score: grade.value,
        weight: grade.weight,
        subject: grade.classSubject?.subject?.name,
        date: grade.createdAt,
      });
      acc[studentId].totalScore += grade.value;
      acc[studentId].gradeCount++;

      return acc;
    }, {} as Record<string, any>);

    // Calculate average for each student
    Object.values(byStudent).forEach((student: any) => {
      student.average = (student.totalScore / student.gradeCount).toFixed(2);
    });

    // Group by subject
    const bySubject = grades.reduce((acc, grade) => {
      const subjectId = grade.classSubject?.subjectId;
      const subjectName = grade.classSubject?.subject?.name || 'N/A';

      if (!acc[subjectId]) {
        acc[subjectId] = {
          subjectId,
          subjectName,
          gradeCount: 0,
          totalScore: 0,
          average: 0,
        };
      }

      acc[subjectId].gradeCount++;
      acc[subjectId].totalScore += grade.value;

      return acc;
    }, {} as Record<string, any>);

    // Calculate average for each subject
    Object.values(bySubject).forEach((subject: any) => {
      subject.average = (subject.totalScore / subject.gradeCount).toFixed(2);
    });

    return {
      summary: {
        totalGrades,
        averageScore,
        highestScore: grades.length > 0 ? Math.max(...grades.map(g => g.value)) : 0,
        lowestScore: grades.length > 0 ? Math.min(...grades.map(g => g.value)) : 0,
      },
      byStudent: Object.values(byStudent),
      bySubject: Object.values(bySubject),
    };
  }

  async getStudentPerformance(studentId: string, currentUser: any) {
    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        classEnrollments: {
          where: { isActive: true },
          include: {
            class: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check access permissions
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (student.user.institutionId !== currentUser.institutionId) {
        throw new ForbiddenException('You do not have access to this student');
      }
    }

    // Get grades
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
      },
      include: {
        classSubject: {
          include: {
            subject: true,
          },
        },
        academicPeriod: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get attendances
    const attendances = await this.prisma.attendance.findMany({
      where: {
        studentId,
      },
      include: {
        classSubject: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Get observations
    const observations = await this.prisma.studentObservation.findMany({
      where: {
        studentId,
        isPrivate: currentUser.role === UserRole.PARENT ? false : undefined,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 10,
    });

    // Calculate statistics
    const totalGrades = grades.length;
    const averageGrade = totalGrades > 0
      ? (grades.reduce((sum, g) => sum + g.value, 0) / totalGrades).toFixed(2)
      : 0;

    const totalAttendances = attendances.length;
    const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
    const absentCount = attendances.filter(a => a.status === 'ABSENT').length;
    const attendanceRate = totalAttendances > 0
      ? ((presentCount / totalAttendances) * 100).toFixed(2)
      : 0;

    // Group grades by subject
    const gradesBySubject = grades.reduce((acc, grade) => {
      const subjectName = grade.classSubject?.subject?.name || 'N/A';
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          grades: [],
          average: 0,
        };
      }
      acc[subjectName].grades.push(grade.value);
      return acc;
    }, {} as Record<string, any>);

    Object.values(gradesBySubject).forEach((subject: any) => {
      const sum = subject.grades.reduce((a: number, b: number) => a + b, 0);
      subject.average = (sum / subject.grades.length).toFixed(2);
    });

    return {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        enrollments: student.classEnrollments.map(e => ({
          classId: e.classId,
          className: e.class.name,
          isActive: e.isActive,
        })),
      },
      academicPerformance: {
        totalGrades,
        averageGrade,
        gradesBySubject: Object.values(gradesBySubject),
      },
      attendance: {
        totalAttendances,
        presentCount,
        absentCount,
        attendanceRate,
      },
      recentObservations: observations,
    };
  }

  async getClassPerformance(classId: string, currentUser: any) {
    // Verify class exists
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        enrollments: {
          where: { isActive: true },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    // Check access permissions
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (classEntity.institutionId !== currentUser.institutionId) {
        throw new ForbiddenException('You do not have access to this class');
      }
    }

    // Get all grades for the class
    const grades = await this.prisma.grade.findMany({
      where: {
        classSubject: {
          classId,
        },
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
    });

    // Get all attendances for the class
    const attendances = await this.prisma.attendance.findMany({
      where: {
        classId,
      },
    });

    // Calculate statistics
    const totalStudents = classEntity.enrollments.filter(e => e.isActive).length;
    const totalGrades = grades.length;
    const averageGrade = totalGrades > 0
      ? (grades.reduce((sum, g) => sum + g.value, 0) / totalGrades).toFixed(2)
      : 0;

    const totalAttendances = attendances.length;
    const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = totalAttendances > 0
      ? ((presentCount / totalAttendances) * 100).toFixed(2)
      : 0;

    // Performance by subject
    const bySubject = grades.reduce((acc, grade) => {
      const subjectName = grade.classSubject?.subject?.name || 'N/A';
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          gradeCount: 0,
          totalScore: 0,
          average: 0,
        };
      }
      acc[subjectName].gradeCount++;
      acc[subjectName].totalScore += grade.value;
      return acc;
    }, {} as Record<string, any>);

    Object.values(bySubject).forEach((subject: any) => {
      subject.average = (subject.totalScore / subject.gradeCount).toFixed(2);
    });

    return {
      class: {
        id: classEntity.id,
        name: classEntity.name,
        totalStudents,
      },
      academicPerformance: {
        totalGrades,
        averageGrade,
        bySubject: Object.values(bySubject),
      },
      attendance: {
        totalAttendances,
        presentCount,
        attendanceRate,
      },
    };
  }

  async getTeacherSummary(teacherId: string, currentUser: any) {
    // Verify teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true,
        classSubjects: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Check access permissions
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (teacher.user.institutionId !== currentUser.institutionId) {
        throw new ForbiddenException('You do not have access to this teacher');
      }
    }

    // Get classes taught
    const classIds = teacher.classSubjects.map(sc => sc.classId);
    const uniqueClassIds = Array.from(new Set(classIds));

    // Get total students across all classes
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        classId: { in: uniqueClassIds },
        isActive: true,
      },
    });

    const totalStudents = new Set(enrollments.map(e => e.studentId)).size;

    // Get grades posted by this teacher
    const grades = await this.prisma.grade.findMany({
      where: {
        teacherId,
      },
    });

    // Get attendances recorded
    const attendances = await this.prisma.attendance.findMany({
      where: {
        teacherId,
      },
    });

    // Get lesson contents created
    const lessonContents = await this.prisma.lessonContent.findMany({
      where: {
        teacherId,
      },
    });

    return {
      teacher: {
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        email: teacher.user.email,
        specialization: teacher.specialization,
      },
      teaching: {
        totalClasses: uniqueClassIds.length,
        totalSubjects: teacher.classSubjects.length,
        totalStudents,
      },
      activity: {
        gradesPosted: grades.length,
        attendancesRecorded: attendances.length,
        lessonContentsCreated: lessonContents.length,
      },
      classes: teacher.classSubjects.map(sc => ({
        className: sc.class.name,
        subjectName: sc.subject.name,
      })),
    };
  }
}
