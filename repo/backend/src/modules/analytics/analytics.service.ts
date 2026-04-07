import { ExportFormat, Prisma, ReportFrequency, ReportStatus, RoleName } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../shared/errors';
import { parsePagination, buildMeta } from '../../shared/utils/pagination.util';
import { auditService } from '../audit/audit.service';
import {
  CreateReportDefinitionBody,
  UpdateReportDefinitionBody,
  ListReportsQuery,
  PivotQueryBody,
} from './analytics.schemas';
import { ExportData, ExportOptions, IReportExporter } from './exporters/exporter.interface';
import { CSVExporter } from './exporters/csv.exporter';
import { ExcelExporter } from './exporters/excel.exporter';
import { PDFExporter } from './exporters/pdf.exporter';
import * as fs from 'fs';
import * as path from 'path';

const EXPORTS_DIR = path.resolve(process.cwd(), 'storage', 'exports');

function getExporter(format: ExportFormat): IReportExporter {
  switch (format) {
    case 'CSV':
      return new CSVExporter();
    case 'EXCEL':
      return new ExcelExporter();
    case 'PDF':
      return new PDFExporter();
    default:
      throw new BadRequestError(`Unsupported export format: ${format}`);
  }
}

function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'CSV':
      return 'csv';
    case 'EXCEL':
      return 'xlsx';
    case 'PDF':
      return 'pdf';
  }
}

function getContentType(format: ExportFormat): string {
  switch (format) {
    case 'CSV':
      return 'text/csv';
    case 'EXCEL':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'PDF':
      return 'application/pdf';
  }
}

// ─── Report Definitions ─────────────────────────────────────────────

async function createDefinition(data: CreateReportDefinitionBody, actorId: string) {
  const definition = await prisma.reportDefinition.create({
    data: {
      name: data.name,
      description: data.description,
      frequency: data.frequency as ReportFrequency,
      filterJson: data.filterJson as Prisma.InputJsonValue,
      pivotConfig: data.pivotConfig as Prisma.InputJsonValue,
      createdBy: actorId,
    },
  });

  await auditService.create({
    action: 'REPORT_DEFINITION_CREATED',
    actorId,
    entityType: 'report_definition',
    entityId: definition.id,
    afterJson: { name: definition.name, frequency: definition.frequency },
  });

  logger.info({ definitionId: definition.id }, 'Report definition created');
  return definition;
}

async function listDefinitions(query: { page?: number; pageSize?: number }) {
  const { skip, take, page, pageSize } = parsePagination(query);

  const [definitions, total] = await Promise.all([
    prisma.reportDefinition.findMany({
      where: { isActive: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { reports: true } },
      },
    }),
    prisma.reportDefinition.count({ where: { isActive: true } }),
  ]);

  return { data: definitions, meta: buildMeta(total, page, pageSize) };
}

async function getDefinition(id: string) {
  const definition = await prisma.reportDefinition.findUnique({
    where: { id },
    include: {
      _count: { select: { reports: true } },
    },
  });

  if (!definition) {
    throw new NotFoundError('Report definition not found');
  }

  return definition;
}

async function updateDefinition(
  id: string,
  data: UpdateReportDefinitionBody,
  actorId?: string,
) {
  const existing = await prisma.reportDefinition.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Report definition not found');
  }

  const definition = await prisma.reportDefinition.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.frequency !== undefined && { frequency: data.frequency as ReportFrequency }),
      ...(data.filterJson !== undefined && { filterJson: data.filterJson as Prisma.InputJsonValue }),
      ...(data.pivotConfig !== undefined && { pivotConfig: data.pivotConfig as Prisma.InputJsonValue }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  await auditService.create({
    action: 'REPORT_DEFINITION_UPDATED',
    actorId: actorId,
    entityType: 'report_definition',
    entityId: id,
    beforeJson: { name: existing.name, frequency: existing.frequency, isActive: existing.isActive },
    afterJson: { name: definition.name, frequency: definition.frequency, isActive: definition.isActive },
  });

  logger.info({ definitionId: definition.id }, 'Report definition updated');
  return definition;
}

// ─── Reports ────────────────────────────────────────────────────────

async function generateReport(
  definitionId: string,
  periodStart: string,
  periodEnd: string,
  actorId: string,
) {
  const definition = await prisma.reportDefinition.findUnique({
    where: { id: definitionId },
  });

  if (!definition) {
    throw new NotFoundError('Report definition not found');
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  if (start >= end) {
    throw new BadRequestError('periodStart must be before periodEnd');
  }

  // Create the report in GENERATING status
  const report = await prisma.report.create({
    data: {
      definitionId,
      periodStart: start,
      periodEnd: end,
      status: 'GENERATING',
      createdBy: actorId,
    },
  });

  try {
    // Query MetricValues for the period, grouped by property and metric type
    const metricValues = await prisma.metricValue.findMany({
      where: {
        periodStart: { gte: start },
        periodEnd: { lte: end },
      },
      include: {
        property: {
          include: {
            community: {
              include: {
                region: true,
              },
            },
          },
        },
        metricDefinitionVersion: {
          include: {
            metricDefinition: true,
          },
        },
      },
      orderBy: { calculatedAt: 'desc' },
    });

    // Build data JSON grouped by property and metric type
    const dataByProperty: Record<string, any> = {};
    const versionIdsUsed = new Set<string>();

    for (const mv of metricValues) {
      const propId = mv.propertyId;
      const metricType = mv.metricDefinitionVersion.metricDefinition.metricType;
      const versionId = mv.metricDefinitionVersionId;

      versionIdsUsed.add(versionId);

      if (!dataByProperty[propId]) {
        dataByProperty[propId] = {
          propertyId: propId,
          propertyName: mv.property.name,
          communityName: mv.property.community.name,
          regionName: mv.property.community.region.name,
          metrics: {},
        };
      }

      if (!dataByProperty[propId].metrics[metricType]) {
        dataByProperty[propId].metrics[metricType] = [];
      }

      dataByProperty[propId].metrics[metricType].push({
        value: mv.value.toString(),
        calculatedAt: mv.calculatedAt.toISOString(),
        periodStart: mv.periodStart.toISOString(),
        periodEnd: mv.periodEnd.toISOString(),
        versionId,
      });
    }

    const dataJson = Object.values(dataByProperty);

    // Lock metric definition versions used
    const versionIds = Array.from(versionIdsUsed);
    if (versionIds.length > 0) {
      await prisma.metricDefinitionVersion.updateMany({
        where: { id: { in: versionIds } },
        data: {
          isLocked: true,
          lockedAt: new Date(),
          lockedByReportId: report.id,
        },
      });
    }

    // Create ReportMetricSnapshot entries
    if (versionIds.length > 0) {
      await prisma.reportMetricSnapshot.createMany({
        data: versionIds.map((versionId) => ({
          reportId: report.id,
          metricDefinitionVersionId: versionId,
        })),
      });
    }

    // Update report with data and PUBLISHED status
    const updatedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        dataJson: dataJson as unknown as Prisma.InputJsonValue,
        status: 'PUBLISHED',
        generatedAt: new Date(),
      },
      include: {
        definition: true,
        metricSnapshots: true,
      },
    });

    await auditService.create({
      action: 'REPORT_PUBLISHED',
      actorId,
      entityType: 'report',
      entityId: report.id,
      metadata: {
        definitionId,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        lockedVersionCount: versionIds.length,
      },
    });

    logger.info(
      { reportId: report.id, definitionId, metricsCount: metricValues.length },
      'Report generated successfully',
    );

    return updatedReport;
  } catch (error: any) {
    await prisma.report.update({
      where: { id: report.id },
      data: { status: 'FAILED' },
    });

    logger.error({ reportId: report.id, error: error.message }, 'Report generation failed');
    throw error;
  }
}

async function listReports(userId: string, query: ListReportsQuery) {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where: Prisma.ReportWhereInput = {
    OR: [
      { createdBy: userId },
      {
        shares: {
          some: {
            userId,
            revokedAt: null,
          },
        },
      },
    ],
  };

  if (query.status) {
    where.status = query.status as ReportStatus;
  }

  if (query.definitionId) {
    where.definitionId = query.definitionId;
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        definition: true,
        _count: { select: { shares: true, exports: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return { data: reports, meta: buildMeta(total, page, pageSize) };
}

async function getReport(id: string, userId: string) {
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      definition: true,
      shares: {
        where: { revokedAt: null },
        include: { user: { select: { id: true, displayName: true, email: true } } },
      },
      exports: {
        orderBy: { createdAt: 'desc' },
      },
      metricSnapshots: {
        include: {
          version: {
            include: { metricDefinition: true },
          },
        },
      },
    },
  });

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  // Check access: user is creator or has an active share
  const isCreator = report.createdBy === userId;
  const hasShare = report.shares.some((s) => s.userId === userId);

  if (!isCreator && !hasShare) {
    throw new ForbiddenError('You do not have access to this report');
  }

  return report;
}

async function publishReport(id: string, actorId: string) {
  const report = await prisma.report.findUnique({ where: { id } });

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  if (report.createdBy !== actorId) {
    throw new ForbiddenError('Only the report creator can publish it');
  }

  if (report.status !== 'DRAFT' && report.status !== 'GENERATING') {
    throw new BadRequestError(`Cannot publish a report with status ${report.status}`);
  }

  const updated = await prisma.report.update({
    where: { id },
    data: { status: 'PUBLISHED', generatedAt: new Date() },
  });

  logger.info({ reportId: id }, 'Report published');
  return updated;
}

// ─── Sharing ────────────────────────────────────────────────────────

async function shareReport(reportId: string, targetUserId: string, actorId: string) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  // Check the target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!targetUser) {
    throw new NotFoundError('Target user not found');
  }

  // Check the target user has a role with report:read permission
  const hasReportReadPermission = targetUser.roles.some((ur) =>
    ur.role.permissions.some(
      (rp) => rp.permission.resource === 'reports' && rp.permission.action === 'read',
    ),
  );

  if (!hasReportReadPermission) {
    throw new ForbiddenError('Cannot share report with user who lacks report read permission');
  }

  // Upsert to handle re-sharing after revocation
  const share = await prisma.reportShare.upsert({
    where: {
      reportId_userId: {
        reportId,
        userId: targetUserId,
      },
    },
    update: {
      revokedAt: null,
      sharedBy: actorId,
      sharedAt: new Date(),
    },
    create: {
      reportId,
      userId: targetUserId,
      sharedBy: actorId,
    },
  });

  await auditService.create({
    action: 'REPORT_SHARED',
    actorId,
    entityType: 'report',
    entityId: reportId,
    metadata: { targetUserId, shareId: share.id },
  });

  logger.info({ reportId, targetUserId, actorId }, 'Report shared');
  return share;
}

async function revokeShare(reportId: string, targetUserId: string, actorId: string) {
  const share = await prisma.reportShare.findUnique({
    where: {
      reportId_userId: {
        reportId,
        userId: targetUserId,
      },
    },
  });

  if (!share) {
    throw new NotFoundError('Report share not found');
  }

  if (share.revokedAt) {
    throw new BadRequestError('Share is already revoked');
  }

  const updated = await prisma.reportShare.update({
    where: { id: share.id },
    data: { revokedAt: new Date() },
  });

  await auditService.create({
    action: 'REPORT_SHARE_REVOKED',
    actorId,
    entityType: 'report',
    entityId: reportId,
    metadata: { targetUserId, shareId: share.id },
  });

  logger.info({ reportId, targetUserId, actorId }, 'Report share revoked');
  return updated;
}

async function listShares(reportId: string, userId: string, isAdmin = false) {
  // Object-level authorization: only the report creator, an active sharee, or
  // a SYSTEM_ADMIN may enumerate the share list. Without this guard any
  // authenticated user could discover who a private report has been shared
  // with by iterating reportIds (BOLA / share enumeration).
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      shares: { where: { userId, revokedAt: null }, select: { id: true } },
    },
  });
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  const isCreator = report.createdBy === userId;
  const hasActiveShare = report.shares.length > 0;
  if (!isCreator && !hasActiveShare && !isAdmin) {
    // 404 (not 403) to avoid disclosing report existence to unrelated users.
    throw new NotFoundError('Report not found');
  }

  const shares = await prisma.reportShare.findMany({
    where: { reportId, revokedAt: null },
    include: {
      user: { select: { id: true, displayName: true, email: true } },
      sharer: { select: { id: true, displayName: true } },
    },
    orderBy: { sharedAt: 'desc' },
  });

  return shares;
}

// ─── Exports ────────────────────────────────────────────────────────

async function requestExport(
  reportId: string,
  format: ExportFormat,
  userId: string,
) {
  // Verify user access to the report
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      definition: true,
      shares: { where: { userId, revokedAt: null } },
      creator: { select: { id: true, displayName: true } },
    },
  });

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  const isCreator = report.createdBy === userId;
  const hasShare = report.shares.length > 0;
  if (!isCreator && !hasShare) {
    // Forwarding-prevention: log the attempted export by an unauthorised user.
    await auditService.create({
      action: 'REPORT_EXPORT_BLOCKED',
      actorId: userId,
      entityType: 'report',
      entityId: reportId,
      metadata: { reason: 'no_access', format },
    });
    throw new ForbiddenError('You do not have access to this report');
  }

  // Re-validate that the requestor STILL has the export permission at request
  // time. This prevents the case where a share was granted, then the user's
  // role was downgraded, but the user still tries to export.
  const requestorWithRoles = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
        },
      },
    },
  });

  const hasExportPermission = (requestorWithRoles?.roles ?? []).some((ur: any) =>
    ur.role.permissions.some(
      (rp: any) =>
        rp.permission.resource === 'reports' && rp.permission.action === 'export',
    ),
  );

  if (!hasExportPermission) {
    await auditService.create({
      action: 'REPORT_EXPORT_BLOCKED',
      actorId: userId,
      entityType: 'report',
      entityId: reportId,
      metadata: { reason: 'missing_export_permission', format },
    });
    throw new ForbiddenError('Your role no longer permits report exports');
  }

  if (report.status !== 'PUBLISHED') {
    throw new BadRequestError('Can only export published reports');
  }

  // Get requesting user's display name
  const requestor = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true },
  });

  const watermarkText = `${requestor?.displayName ?? 'Unknown'} | ${new Date().toISOString()}`;

  // Create the export request
  const exportRequest = await prisma.exportRequest.create({
    data: {
      reportId,
      requestedBy: userId,
      format,
      watermarkText,
      status: 'GENERATING',
    },
  });

  try {
    // Build export data from report
    const reportData = (report.dataJson ?? []) as any[];
    const columns = buildExportColumns(reportData);
    const rows = buildExportRows(reportData);

    const exportData: ExportData = {
      title: report.definition.name,
      columns,
      rows,
      metadata: {
        generatedAt: report.generatedAt?.toISOString() ?? new Date().toISOString(),
        generatedBy: report.creator.displayName,
        reportId: report.id,
      },
    };

    const exportOptions: ExportOptions = {
      watermarkText,
      format,
    };

    const exporter = getExporter(format);
    const buffer = await exporter.export(exportData, exportOptions);

    // Ensure exports directory exists
    await fs.promises.mkdir(EXPORTS_DIR, { recursive: true });

    const ext = getFileExtension(format);
    const fileName = `report-${report.id}-${exportRequest.id}.${ext}`;
    const filePath = path.join(EXPORTS_DIR, fileName);

    await fs.promises.writeFile(filePath, buffer);

    // Update export request with file path and READY status
    const updatedExport = await prisma.exportRequest.update({
      where: { id: exportRequest.id },
      data: {
        filePath,
        status: 'READY',
        completedAt: new Date(),
      },
    });

    await auditService.create({
      action: 'REPORT_EXPORTED',
      actorId: userId,
      entityType: 'report',
      entityId: reportId,
      metadata: {
        exportId: exportRequest.id,
        format,
        watermarkText,
      },
    });

    logger.info(
      { exportId: exportRequest.id, reportId, format },
      'Report export generated',
    );

    return updatedExport;
  } catch (error: any) {
    await prisma.exportRequest.update({
      where: { id: exportRequest.id },
      data: { status: 'FAILED', completedAt: new Date() },
    });

    logger.error(
      { exportId: exportRequest.id, error: error.message },
      'Report export generation failed',
    );
    throw error;
  }
}

function buildExportColumns(reportData: any[]): { key: string; label: string }[] {
  const columns = [
    { key: 'propertyName', label: 'Property' },
    { key: 'communityName', label: 'Community' },
    { key: 'regionName', label: 'Region' },
  ];

  // Collect all metric types from data
  const metricTypes = new Set<string>();
  for (const entry of reportData) {
    if (entry.metrics) {
      Object.keys(entry.metrics).forEach((mt) => metricTypes.add(mt));
    }
  }

  for (const mt of metricTypes) {
    columns.push({ key: `metric_${mt}`, label: mt.replace(/_/g, ' ') });
  }

  return columns;
}

function buildExportRows(reportData: any[]): Record<string, any>[] {
  const rows: Record<string, any>[] = [];

  for (const entry of reportData) {
    const row: Record<string, any> = {
      propertyName: entry.propertyName,
      communityName: entry.communityName,
      regionName: entry.regionName,
    };

    if (entry.metrics) {
      for (const [metricType, values] of Object.entries(entry.metrics)) {
        const metricArray = values as any[];
        // Use the latest value for each metric type
        if (metricArray.length > 0) {
          row[`metric_${metricType}`] = metricArray[0].value;
        }
      }
    }

    rows.push(row);
  }

  return rows;
}

async function downloadExport(exportId: string, userId: string) {
  const exportReq = await prisma.exportRequest.findUnique({
    where: { id: exportId },
    include: {
      report: {
        include: { shares: { where: { userId, revokedAt: null } } },
      },
    },
  });

  if (!exportReq) {
    throw new NotFoundError('Export request not found');
  }

  // Hard rule: only the user who originally requested the export can download
  // it. This is the primary forwarding-prevention guard — even if the file is
  // posted to a chat, the link won't work for any other user account.
  if (exportReq.requestedBy !== userId) {
    await auditService.create({
      action: 'REPORT_EXPORT_BLOCKED',
      actorId: userId,
      entityType: 'export_request',
      entityId: exportId,
      metadata: { reason: 'not_requestor', requestor: exportReq.requestedBy },
    });
    throw new ForbiddenError('You can only download your own exports');
  }

  // Re-verify the requestor STILL has access to the underlying report. If
  // their share was revoked between request and download, block the download.
  const isCreator = exportReq.report.createdBy === userId;
  const hasActiveShare = exportReq.report.shares.length > 0;
  if (!isCreator && !hasActiveShare) {
    await auditService.create({
      action: 'REPORT_EXPORT_BLOCKED',
      actorId: userId,
      entityType: 'export_request',
      entityId: exportId,
      metadata: { reason: 'share_revoked' },
    });
    throw new ForbiddenError('Your access to this report has been revoked');
  }

  if (exportReq.status !== 'READY' || !exportReq.filePath) {
    throw new BadRequestError('Export is not ready for download');
  }

  await auditService.create({
    action: 'REPORT_EXPORT_DOWNLOADED',
    actorId: userId,
    entityType: 'export_request',
    entityId: exportId,
    metadata: { reportId: exportReq.reportId, format: exportReq.format },
  });

  return {
    filePath: exportReq.filePath,
    contentType: getContentType(exportReq.format),
    fileName: path.basename(exportReq.filePath),
  };
}

/**
 * Archive a report. Only the creator (or SYSTEM_ADMIN) can archive.
 * Sets status to ARCHIVED and records an audit entry.
 */
async function archiveReport(id: string, actorId: string, actorRoles: string[]) {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw new NotFoundError('Report not found');

  const isAdmin = actorRoles.includes('SYSTEM_ADMIN');
  if (report.createdBy !== actorId && !isAdmin) {
    throw new ForbiddenError('Only the report creator or an admin can archive it');
  }

  if (report.status === 'ARCHIVED') {
    throw new BadRequestError('Report is already archived');
  }

  const updated = await prisma.report.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });

  await auditService.create({
    action: 'REPORT_ARCHIVED',
    actorId,
    entityType: 'report',
    entityId: id,
    beforeJson: { status: report.status },
    afterJson: { status: 'ARCHIVED' },
  });

  logger.info({ reportId: id, actorId }, 'Report archived');
  return updated;
}

// ─── Pivot Analytics ────────────────────────────────────────────────

async function pivotQuery(body: PivotQueryBody) {
  const { dimensions, measures, filters } = body;

  // Build the where clause for MetricValues
  const where: Prisma.MetricValueWhereInput = {};

  if (filters?.dateFrom || filters?.dateTo) {
    where.periodEnd = {};
    if (filters.dateFrom) where.periodEnd.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.periodEnd.lte = new Date(filters.dateTo);
  }

  if (filters?.regionId) {
    where.property = {
      ...((where.property as Prisma.PropertyWhereInput) ?? {}),
      community: { regionId: filters.regionId },
    };
  }

  if (filters?.communityId) {
    where.property = {
      ...((where.property as Prisma.PropertyWhereInput) ?? {}),
      communityId: filters.communityId,
    };
  }

  if (filters?.metricType) {
    where.metricDefinitionVersion = {
      metricDefinition: {
        metricType: filters.metricType as any,
      },
    };
  }

  // Fetch metric values with all needed relations
  const metricValues = await prisma.metricValue.findMany({
    where,
    include: {
      property: {
        include: {
          community: {
            include: { region: true },
          },
        },
      },
      metricDefinitionVersion: {
        include: { metricDefinition: true },
      },
    },
  });

  // Group by dimensions and calculate measures in-memory
  const groups = new Map<string, { keys: Record<string, string>; values: number[] }>();

  for (const mv of metricValues) {
    const keyParts: Record<string, string> = {};

    for (const dim of dimensions) {
      switch (dim) {
        case 'region':
          keyParts.region = mv.property.community.region.name;
          break;
        case 'community':
          keyParts.community = mv.property.community.name;
          break;
        case 'property':
          keyParts.property = mv.property.name;
          break;
        case 'metric_type':
          keyParts.metric_type = mv.metricDefinitionVersion.metricDefinition.metricType;
          break;
        case 'month':
          keyParts.month = `${mv.periodEnd.getFullYear()}-${String(mv.periodEnd.getMonth() + 1).padStart(2, '0')}`;
          break;
      }
    }

    const groupKey = dimensions.map((d) => keyParts[d]).join('|');

    if (!groups.has(groupKey)) {
      groups.set(groupKey, { keys: keyParts, values: [] });
    }

    groups.get(groupKey)!.values.push(Number(mv.value));
  }

  // Calculate measures for each group
  const rows: Record<string, any>[] = [];

  for (const [, group] of groups) {
    const row: Record<string, any> = { ...group.keys };
    const vals = group.values;

    for (const measure of measures) {
      switch (measure) {
        case 'avg_value':
          row.avg_value = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          break;
        case 'sum_value':
          row.sum_value = vals.reduce((a, b) => a + b, 0);
          break;
        case 'count':
          row.count = vals.length;
          break;
        case 'min_value':
          row.min_value = vals.length > 0 ? Math.min(...vals) : 0;
          break;
        case 'max_value':
          row.max_value = vals.length > 0 ? Math.max(...vals) : 0;
          break;
      }
    }

    rows.push(row);
  }

  return { dimensions, measures, rows };
}

// ─── Scheduled Generation ───────────────────────────────────────────

async function generateScheduledReports(frequency: ReportFrequency) {
  const definitions = await prisma.reportDefinition.findMany({
    where: {
      frequency,
      isActive: true,
    },
  });

  logger.info(
    { frequency, count: definitions.length },
    'Starting scheduled report generation',
  );

  const now = new Date();
  let periodStart: Date;

  switch (frequency) {
    case 'DAILY':
      periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'WEEKLY':
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'MONTHLY':
      periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return [];
  }

  const results: any[] = [];

  for (const definition of definitions) {
    try {
      const report = await generateReport(
        definition.id,
        periodStart.toISOString(),
        now.toISOString(),
        definition.createdBy,
      );
      results.push({ definitionId: definition.id, reportId: report.id, status: 'success' });
    } catch (error: any) {
      logger.error(
        { definitionId: definition.id, error: error.message },
        'Scheduled report generation failed',
      );
      results.push({ definitionId: definition.id, status: 'failed', error: error.message });
    }
  }

  return results;
}

// ─── Schedules (compat: definitions with a non-ON_DEMAND frequency) ──────────

async function deleteDefinition(id: string) {
  const existing = await prisma.reportDefinition.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Report definition not found');
  const definition = await prisma.reportDefinition.update({
    where: { id },
    data: { isActive: false },
  });
  logger.info({ definitionId: id }, 'Report definition soft-deleted');
  return definition;
}

async function listSchedules(query: { page?: number; pageSize?: number }) {
  const { skip, take, page, pageSize } = parsePagination(query);
  const where = { isActive: true, frequency: { not: 'ON_DEMAND' as ReportFrequency } };
  const [definitions, total] = await Promise.all([
    prisma.reportDefinition.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { reports: true } } },
    }),
    prisma.reportDefinition.count({ where }),
  ]);
  return { data: definitions, meta: buildMeta(total, page, pageSize) };
}

export const analyticsService = {
  // Definitions
  createDefinition,
  listDefinitions,
  getDefinition,
  updateDefinition,
  deleteDefinition,
  // Reports
  generateReport,
  listReports,
  getReport,
  publishReport,
  archiveReport,
  // Sharing
  shareReport,
  revokeShare,
  listShares,
  // Exports
  requestExport,
  downloadExport,
  // Pivot
  pivotQuery,
  // Scheduled
  generateScheduledReports,
  listSchedules,
};
