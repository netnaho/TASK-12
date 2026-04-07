import { NotificationStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import { NotFoundError } from '../../shared/errors';
import { parsePagination, buildMeta } from '../../shared/utils/pagination.util';
import {
  CreateNotificationBody,
  ListNotificationsQuery,
  CreateTemplateBody,
  UpdateTemplateBody,
} from './notifications.schemas';

export class NotificationsService {
  // ─── NOTIFICATIONS ──────────────────────────────────────────────────

  async create(data: CreateNotificationBody) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        body: data.body,
        category: data.category ?? 'general',
        isTaskReminder: data.isTaskReminder ?? false,
        templateId: data.templateId ?? null,
      },
    });
    logger.info({ notificationId: notification.id, userId: data.userId }, 'Notification created');
    return notification;
  }

  async listForUser(userId: string, filters: ListNotificationsQuery) {
    const { skip, take, page, pageSize } = parsePagination(filters);

    const where: Prisma.NotificationWhereInput = { userId };

    if (filters.status) {
      where.status = filters.status as NotificationStatus;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isTaskReminder !== undefined) {
      where.isTaskReminder = filters.isTaskReminder;
    }

    // Exclude snoozed notifications whose snooze period has not elapsed
    where.NOT = {
      status: 'SNOOZED',
      snoozedUntil: { gt: new Date() },
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { template: { select: { id: true, slug: true, name: true } } },
      }),
      prisma.notification.count({ where }),
    ]);

    return { data: notifications, meta: buildMeta(total, page, pageSize) };
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, status: 'UNREAD' },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundError('Notification not found');

    const updated = await prisma.notification.update({
      where: { id },
      data: { status: 'READ', readAt: new Date() },
    });
    logger.info({ notificationId: id, userId }, 'Notification marked as read');
    return updated;
  }

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });
    logger.info({ userId, count: result.count }, 'All notifications marked as read');
    return { updated: result.count };
  }

  async snooze(id: string, userId: string, until: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundError('Notification not found');

    const updated = await prisma.notification.update({
      where: { id },
      data: { status: 'SNOOZED', snoozedUntil: new Date(until) },
    });
    logger.info({ notificationId: id, userId, snoozedUntil: until }, 'Notification snoozed');
    return updated;
  }

  async dismiss(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundError('Notification not found');

    const updated = await prisma.notification.update({
      where: { id },
      data: { status: 'DISMISSED' },
    });
    logger.info({ notificationId: id, userId }, 'Notification dismissed');
    return updated;
  }

  // ─── TEMPLATES ────────────────────────────────────────────────────

  async listTemplates() {
    return prisma.notificationTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplate(id: string) {
    const template = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundError('Notification template not found');
    return template;
  }

  async createTemplate(data: CreateTemplateBody) {
    const template = await prisma.notificationTemplate.create({ data });
    logger.info({ templateId: template.id, slug: data.slug }, 'Notification template created');
    return template;
  }

  async updateTemplate(id: string, data: UpdateTemplateBody) {
    await this.getTemplate(id);
    const template = await prisma.notificationTemplate.update({ where: { id }, data });
    logger.info({ templateId: id }, 'Notification template updated');
    return template;
  }

  async deleteTemplate(id: string) {
    await this.getTemplate(id); // throws NotFoundError if not found
    await prisma.notificationTemplate.delete({ where: { id } });
    logger.info({ templateId: id }, 'Notification template deleted');
  }

  async previewTemplate(templateId: string, variables: Record<string, string>) {
    const template = await this.getTemplate(templateId);

    const renderTemplate = (tpl: string, vars: Record<string, string>): string => {
      return tpl.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return key in vars ? vars[key] : match;
      });
    };

    const renderedSubject = renderTemplate(template.subjectTpl, variables);
    const renderedBody = renderTemplate(template.bodyTpl, variables);

    return {
      templateId,
      slug: template.slug,
      channel: template.channel,
      renderedSubject,
      renderedBody,
    };
  }
}

export const notificationsService = new NotificationsService();
