-- Analytics & Reporting Hub additions
-- 1. New AuditAction enum values for sharing/export/saved-views/schedule
-- 2. Optional region/community attribution on test_sites
-- 3. saved_views table
-- 4. report_schedule_executions table

-- ──────────────────────────────────────────────────────────────────────────
-- AuditAction enum
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE `audit_logs`
  MODIFY `action` ENUM(
    'USER_CREATED','USER_UPDATED','USER_DEACTIVATED','USER_ROLE_ASSIGNED','USER_ROLE_REMOVED',
    'USER_LOGGED_IN','USER_LOGGED_OUT',
    'PROPERTY_CREATED','PROPERTY_UPDATED',
    'LISTING_CREATED','LISTING_UPDATED','LISTING_LEASED','LISTING_DELISTED',
    'METRIC_DEF_CREATED','METRIC_DEF_UPDATED','METRIC_DEF_VERSION_CREATED',
    'METRIC_DEF_VERSION_LOCKED','METRIC_CALC_TRIGGERED','METRIC_CALC_COMPLETED',
    'TEST_SESSION_CREATED','TEST_SESSION_UPDATED','TEST_SESSION_CANCELLED',
    'SEAT_ALLOCATION_CREATED','SEAT_ALLOCATION_CHANGED','SEAT_ALLOCATION_CANCELLED',
    'ADA_SEAT_RELEASED','ADA_SEAT_RELEASE_REVOKED',
    'REPORT_CREATED','REPORT_PUBLISHED','REPORT_SHARED','REPORT_SHARE_REVOKED',
    'REPORT_EXPORTED','REPORT_ARCHIVED',
    'REPORT_DEFINITION_CREATED','REPORT_DEFINITION_UPDATED',
    'REPORT_EXPORT_DOWNLOADED','REPORT_EXPORT_BLOCKED',
    'SAVED_VIEW_CREATED','SAVED_VIEW_UPDATED','SAVED_VIEW_DELETED',
    'REPORT_SCHEDULE_EXECUTED',
    'NOTIFICATION_TEMPLATE_CREATED','NOTIFICATION_TEMPLATE_UPDATED',
    'BLACKLIST_ENTRY_ADDED','BLACKLIST_ENTRY_REMOVED','MESSAGE_DELIVERY_FAILED',
    'QUIET_HOURS_UPDATED'
  ) NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- test_sites: add region_id / community_id (nullable)
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE `test_sites`
  ADD COLUMN `region_id`    CHAR(36) NULL AFTER `timezone`,
  ADD COLUMN `community_id` CHAR(36) NULL AFTER `region_id`,
  ADD INDEX `test_sites_region_id_idx` (`region_id`),
  ADD INDEX `test_sites_community_id_idx` (`community_id`),
  ADD CONSTRAINT `test_sites_region_id_fkey`
    FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `test_sites_community_id_fkey`
    FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON DELETE SET NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- saved_views
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE `saved_views` (
  `id`          CHAR(36)                              NOT NULL,
  `name`        VARCHAR(255)                          NOT NULL,
  `description` TEXT                                  NULL,
  `view_type`   ENUM('PIVOT','FILTER','DASHBOARD')   NOT NULL,
  `owner_id`    CHAR(36)                              NOT NULL,
  `config`      JSON                                  NOT NULL,
  `is_public`   TINYINT(1)                            NOT NULL DEFAULT 0,
  `created_at`  DATETIME(3)                           NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)                           NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `saved_views_owner_id_idx` (`owner_id`),
  INDEX `saved_views_view_type_is_public_idx` (`view_type`, `is_public`),
  CONSTRAINT `saved_views_owner_id_fkey`
    FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────────────────
-- report_schedule_executions
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE `report_schedule_executions` (
  `id`                CHAR(36)                                            NOT NULL,
  `frequency`         ENUM('DAILY','WEEKLY','MONTHLY','ON_DEMAND')       NOT NULL,
  `status`            ENUM('RUNNING','SUCCEEDED','FAILED','PARTIAL')      NOT NULL DEFAULT 'RUNNING',
  `started_at`        DATETIME(3)                                         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completed_at`      DATETIME(3)                                         NULL,
  `total_definitions` INT                                                 NOT NULL DEFAULT 0,
  `generated_count`   INT                                                 NOT NULL DEFAULT 0,
  `failed_count`      INT                                                 NOT NULL DEFAULT 0,
  `triggered_by`      VARCHAR(50)                                         NOT NULL DEFAULT 'cron',
  `error_message`     TEXT                                                NULL,
  PRIMARY KEY (`id`),
  INDEX `report_schedule_executions_freq_started_idx` (`frequency`, `started_at`),
  INDEX `report_schedule_executions_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
