import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Criar notificação
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    sentById?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        sentById,
      },
    });
  }

  // Notificação de pendente de aprovação (para admins)
  async notifyPendingApproval(
    newUserId: string,
    institutionId: string,
  ) {
    // Buscar todos os admins da instituição
    const admins = await this.prisma.user.findMany({
      where: {
        institutionId,
        role: {
          in: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
        },
        isActive: true,
      },
    });

    // Buscar dados do novo usuário
    const newUser = await this.prisma.user.findUnique({
      where: { id: newUserId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    if (!newUser) {
      return [];
    }

    // Criar notificação para cada admin
    const notifications = admins.map((admin) =>
      this.create(
        admin.id,
        NotificationType.PENDING_APPROVAL,
        'Novo cadastro pendente de aprovação',
        `${newUser.firstName} ${newUser.lastName} solicitou cadastro como ${newUser.role}`,
        {
          userId: newUserId,
          userName: `${newUser.firstName} ${newUser.lastName}`,
          userEmail: newUser.email,
          role: newUser.role,
        },
      ),
    );

    return Promise.all(notifications);
  }

  // Notificação de aprovação (para o usuário)
  async notifyUserApproved(
    userId: string,
    profileType: string,
    approvedById: string,
  ) {
    return this.create(
      userId,
      NotificationType.USER_APPROVED,
      'Cadastro aprovado!',
      `Seu cadastro foi aprovado! Agora você tem acesso ao perfil de ${profileType}.`,
      { profileType },
      approvedById,
    );
  }

  // Contar pendentes de aprovação
  async getPendingApprovalsCount(institutionId: string) {
    return this.prisma.user.count({
      where: {
        institutionId,
        isActive: true,
        requestedProfileType: { not: null },
        AND: [
          { teacherProfile: null },
          { studentProfile: null },
          { parentProfile: null },
        ],
      },
    });
  }

  // Listar notificações do usuário
  async findByUser(
    userId: string,
    read?: boolean,
    type?: NotificationType,
    limit = 20,
    offset = 0,
  ) {
    const where: any = { userId };

    if (read !== undefined) {
      where.status = read ? NotificationStatus.READ : NotificationStatus.UNREAD;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          sentBy: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Marcar como lida
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Garantir que é do usuário
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  // Marcar todas como lidas
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  // Contar não lidas
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  // Deletar notificação
  async remove(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId, // Garantir que é do usuário
      },
    });
  }
}
