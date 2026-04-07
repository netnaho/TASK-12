-- LeaseOps Insight & Assessment — Initial Schema Migration
-- MySQL 8.0+  |  utf8mb4 / utf8mb4_unicode_ci

-- ══════════════════════════════════════════════════════════════════════════════
-- RBAC
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE `roles` (
    `id`          CHAR(36)     NOT NULL,
    `name`        ENUM('SYSTEM_ADMIN','LEASING_OPS_MANAGER','TEST_PROCTOR','ANALYST','STANDARD_USER') NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`  DATETIME(3)  NOT NULL,
    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `permissions` (
    `id`          CHAR(36)     NOT NULL,
    `resource`    VARCHAR(100) NOT NULL,
    `action`      VARCHAR(50)  NOT NULL,
    `description` VARCHAR(255) NULL,
    UNIQUE INDEX `permissions_resource_action_key`(`resource`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
    `role_id`       CHAR(36) NOT NULL,
    `permission_id` CHAR(36) NOT NULL,
    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════════════════
-- USERS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE `users` (
    `id`                     CHAR(36)      NOT NULL,
    `username`               VARCHAR(100)  NOT NULL,
    `password_hash`          VARCHAR(255)  NOT NULL,
    `employee_id_ciphertext` MEDIUMBLOB    NULL,
    `employee_id_iv`         VARBINARY(16) NULL,
    `employee_id_hash`       VARCHAR(64)   NULL COMMENT 'SHA-256 of plaintext employeeId for indexed equality lookup',
    `display_name`           VARCHAR(200)  NOT NULL,
    `email`                  VARCHAR(255)  NOT NULL,
    `phone`                  VARCHAR(30)   NULL,
    `is_active`              BOOLEAN       NOT NULL DEFAULT TRUE,
    `deactivated_at`         DATETIME(3)   NULL,
    `deactivated_by`         CHAR(36)      NULL,
    `created_at`             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`             DATETIME(3)   NOT NULL,
    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_is_active_idx`(`is_active`),
    INDEX `users_employee_id_hash_idx`(`employee_id_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
    `user_id`    CHAR(36)    NOT NULL,
    `role_id`    CHAR(36)    NOT NULL,
    `granted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `granted_by` CHAR(36)    NOT NULL,
    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Application-level session metadata tracker.
-- express-mysql-session manages its own `sessions` table for cookie storage.
-- This table provides auditable metadata: IP, user-agent, revocation.
CREATE TABLE `app_sessions` (
    `id`               CHAR(36)     NOT NULL,
    `user_id`          CHAR(36)     NOT NULL,
    `session_id_hash`  VARCHAR(64)  NOT NULL COMMENT 'SHA-256 of express-session ID',
    `last_activity_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at`       DATETIME(3)  NOT NULL,
    `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip_address`       VARCHAR(45)  NULL,
    `user_agent`       VARCHAR(512) NULL,
    `revoked_at`       DATETIME(3)  NULL,
    UNIQUE INDEX `app_sessions_session_id_hash_key`(`session_id_hash`),
    INDEX `app_sessions_user_id_idx`(`user_id`),
    INDEX `app_sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════════════════
-- PROPERTY & LISTINGS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE `regions` (
    `id`         CHAR(36)     NOT NULL,
    `name`       VARCHAR(150) NOT NULL,
    `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3)  NOT NULL,
    UNIQUE INDEX `regions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `communities` (
    `id`         CHAR(36)     NOT NULL,
    `name`       VARCHAR(200) NOT NULL,
    `region_id`  CHAR(36)     NOT NULL,
    `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3)  NOT NULL,
    UNIQUE INDEX `communities_region_name_key`(`region_id`, `name`),
    INDEX `communities_region_id_idx`(`region_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `properties` (
    `id`            CHAR(36)       NOT NULL,
    `community_id`  CHAR(36)       NOT NULL,
    `name`          VARCHAR(255)   NOT NULL,
    `address_line1` VARCHAR(255)   NOT NULL,
    `address_line2` VARCHAR(255)   NULL,
    `city`          VARCHAR(100)   NOT NULL,
    `state`         VARCHAR(50)    NOT NULL,
    `postal_code`   VARCHAR(20)    NOT NULL,
    `latitude`      DECIMAL(10, 7) NOT NULL,
    `longitude`     DECIMAL(10, 7) NOT NULL,
    `total_units`   INT            NOT NULL,
    `is_active`     BOOLEAN        NOT NULL DEFAULT TRUE,
    `created_at`    DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3)    NOT NULL,
    INDEX `properties_community_id_idx`(`community_id`),
    INDEX `properties_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `listings` (
    `id`          CHAR(36)       NOT NULL,
    `property_id` CHAR(36)       NOT NULL,
    `unit_number` VARCHAR(50)    NOT NULL,
    `bedrooms`    INT            NOT NULL,
    `bathrooms`   DECIMAL(3, 1)  NOT NULL,
    `sqft`        INT            NOT NULL,
    `rent_price`  DECIMAL(10, 2) NOT NULL,
    `listed_at`   DATETIME(3)    NOT NULL,
    `leased_at`   DATETIME(3)    NULL,
    `delisted_at` DATETIME(3)    NULL,
    `is_active`   BOOLEAN        NOT NULL DEFAULT TRUE,
    `notes`       TEXT           NULL,
    `created_at`  DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`  DATETIME(3)    NOT NULL,
    UNIQUE INDEX `listings_active_unit_key`(`property_id`, `unit_number`, `is_active`),
    INDEX `listings_property_active_idx`(`property_id`, `is_active`),
    INDEX `listings_listed_at_idx`(`listed_at`),
    INDEX `listings_leased_at_idx`(`leased_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════════════════
-- METRIC DEFINITIONS (VERSIONED)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE `metric_definitions` (
    `id`          CHAR(36)    NOT NULL,
    `metric_type` ENUM('UNIT_RENT','PRICE_CHANGE_PCT','VOLATILITY_30D','VACANCY_DAYS_ON_MARKET','LISTING_DURATION_DOM','SUPPLY_DEMAND_RATIO') NOT NULL,
    `name`        VARCHAR(200) NOT NULL,
    `description` TEXT         NULL,
    `is_active`   BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`  DATETIME(3)  NOT NULL,
    INDEX `metric_definitions_type_active_idx`(`metric_type`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `metric_definition_versions` (
    `id`                   CHAR(36)     NOT NULL,
    `metric_definition_id` CHAR(36)     NOT NULL,
    `version_number`       INT          NOT NULL,
    `formula_json`         JSON         NOT NULL,
    `effective_from`       DATETIME(3)  NOT NULL,
    `effective_to`         DATETIME(3)  NULL,
    `is_locked`            BOOLEAN      NOT NULL DEFAULT FALSE,
    `locked_at`            DATETIME(3)  NULL,
    `locked_by_report_id`  CHAR(36)     NULL,
    `notes`                VARCHAR(500) NULL,
    `created_at`           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by`           CHAR(36)     NOT NULL,
    UNIQUE INDEX `mdv_def_version_key`(`metric_definition_id`, `version_number`),
    INDEX `mdv_eff_date_idx`(`metric_definition_id`, `effective_from`),
    INDEX `mdv_is_locked_idx`(`is_locked`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `metric_values` (
    `id`                    CHAR(36)       NOT NULL,
    `property_id`           CHAR(36)       NOT NULL,
    `metric_def_version_id` CHAR(36)       NOT NULL,
    `value`                 DECIMAL(18, 6) NOT NULL,
    `calculated_at`         DATETIME(3)    NOT NULL,
    `period_start`          DATETIME(3)    NOT NULL,
    `period_end`            DATETIME(3)    NOT NULL,
    INDEX `mv_prop_ver_period_idx`(`property_id`, `metric_def_version_id`, `period_end`),
    INDEX `mv_calculated_at_idx`(`calculated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `metric_calc_jobs` (
    `id`           CHAR(36)    NOT NULL,
    `triggered_by` VARCHAR(50) NOT NULL COMMENT 'cron | manual | userId',
    `requested_by` CHAR(36)    NULL,
    `status`       ENUM('PENDING','RUNNING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
    `started_at`   DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `error_log`    TEXT        NULL,
    `created_at`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `metric_calc_jobs_status_idx`(`status`),
    INDEX `metric_calc_jobs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `metric_calc_job_versions` (
    `job_id`     CHAR(36) NOT NULL,
    `version_id` CHAR(36) NOT NULL,
    PRIMARY KEY (`job_id`, `version_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════════════════
-- TEST CENTER
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE `test_sites` (
    `id`         CHAR(36)     NOT NULL,
    `name`       VARCHAR(200) NOT NULL,
    `address`    VARCHAR(500) NOT NULL,
    `timezone`   VARCHAR(50)  NOT NULL,
    `is_active`  BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3)  NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `test_rooms` (
    `id`         CHAR(36)     NOT NULL,
    `site_id`    CHAR(36)     NOT NULL,
    `name`       VARCHAR(100) NOT NULL,
    `capacity`   INT          NOT NULL,
    `has_ada`    BOOLEAN      NOT NULL DEFAULT FALSE,
    `notes`      VARCHAR(500) NULL,
    `is_active`  BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3)  NOT NULL,
    UNIQUE INDEX `test_rooms_site_name_key`(`site_id`, `name`),
    INDEX `test_rooms_site_id_idx`(`site_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `test_seats` (
    `id`              CHAR(36)     NOT NULL,
    `room_id`         CHAR(36)     NOT NULL,
    `seat_label`      VARCHAR(20)  NOT NULL,
    `row_identifier`  VARCHAR(10)  NOT NULL,
    `position_in_row` INT          NOT NULL,
    `is_accessible`   BOOLEAN      NOT NULL DEFAULT FALSE,
    `has_equipment`   BOOLEAN      NOT NULL DEFAULT TRUE,
    `is_serviceable`  BOOLEAN      NOT NULL DEFAULT TRUE,
    `notes`           VARCHAR(255) NULL,
    `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`      DATETIME(3)  NOT NULL,
    UNIQUE INDEX `test_seats_room_label_key`(`room_id`, `seat_label`),
    INDEX `test_seats_order_idx`(`room_id`, `row_identifier`, `position_in_row`),
    INDEX `test_seats_ada_svc_idx`(`room_id`, `is_accessible`, `is_serviceable`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `equipment_ledger_entries` (
    `id`             CHAR(36)     NOT NULL,
    `seat_id`        CHAR(36)     NOT NULL,
    `equipment_type` VARCHAR(100) NOT NULL,
    `serial_number`  VARCHAR(100) NULL,
    `status`         ENUM('OPERATIONAL','FAULTY','NEEDS_REPAIR','UNDER_MAINTENANCE','DECOMMISSIONED','RETIRED','MISSING') NOT NULL DEFAULT 'OPERATIONAL',
    `installed_at`   DATETIME(3)  NOT NULL,
    `removed_at`     DATETIME(3)  NULL,
    `notes`          TEXT         NULL,
    INDEX `equipment_seat_status_idx`(`seat_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ADA seat released for general use within a specific session
CREATE TABLE `ada_seat_releases` (
    `id`          CHAR(36)     NOT NULL,
    `seat_id`     CHAR(36)     NOT NULL,
    `session_id`  CHAR(36)     NOT NULL,
    `released_by` CHAR(36)     NOT NULL,
    `reason`      VARCHAR(500) NULL,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `ada_seat_releases_seat_session_key`(`seat_id`, `session_id`),
    INDEX `ada_seat_releases_session_id_idx`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `test_sessions` (
    `id`               CHAR(36)    NOT NULL,
    `room_id`          CHAR(36)    NOT NULL,
    `name`             VARCHAR(255) NOT NULL,
    `description`      TEXT         NULL,
    `scheduled_start`  DATETIME(3)  NOT NULL,
    `scheduled_end`    DATETIME(3)  NOT NULL,
    `setup_buffer_min` INT          NOT NULL DEFAULT 10,
    `max_capacity`      INT          NOT NULL,
    `current_enrolled`  INT          NOT NULL DEFAULT 0,
    `status`            ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `created_by`       CHAR(36)     NOT NULL,
    `cancelled_at`     DATETIME(3)  NULL,
    `cancelled_by`     CHAR(36)     NULL,
    `notes`            TEXT         NULL,
    `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`       DATETIME(3)  NOT NULL,
    -- Scheduling conflict check index
    INDEX `test_sessions_conflict_idx`(`room_id`, `scheduled_start`, `scheduled_end`),
    INDEX `test_sessions_room_status_idx`(`room_id`, `status`),
    INDEX `test_sessions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `test_registrations` (
    `id`            CHAR(36)    NOT NULL,
    `session_id`    CHAR(36)    NOT NULL,
    `user_id`       CHAR(36)    NOT NULL,
    `registered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cancelled_at`  DATETIME(3) NULL,
    UNIQUE INDEX `test_registrations_session_user_key`(`session_id`, `user_id`),
    INDEX `test_registrations_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `seat_allocations` (
    `id`              CHAR(36)    NOT NULL,
    `session_id`      CHAR(36)    NOT NULL,
    `registration_id` CHAR(36)    NOT NULL,
    `seat_id`         CHAR(36)    NOT NULL,
    `user_id`         CHAR(36)    NOT NULL,
    `allocated_by`    VARCHAR(50) NOT NULL DEFAULT 'auto' COMMENT 'auto | manual | userId',
    `allocated_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `seat_allocations_registration_key`(`registration_id`),
    UNIQUE INDEX `seat_allocations_session_seat_key`(`session_id`, `seat_id`),
    INDEX `seat_allocations_seat_id_idx`(`seat_id`),
    INDEX `seat_allocations_session_id_idx`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS & OUTBOUND MESSAGING
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE `notification_templates` (
    `id`          CHAR(36)     NOT NULL,
    `slug`        VARCHAR(100) NOT NULL,
    `name`        VARCHAR(200) NOT NULL,
    `channel`     ENUM('EMAIL','IN_APP','SMS','FILE') NOT NULL,
    `subject_tpl` VARCHAR(500) NOT NULL,
    `body_tpl`    TEXT         NOT NULL,
    `is_active`   BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`  DATETIME(3)  NOT NULL,
    UNIQUE INDEX `notification_templates_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
    `id`           CHAR(36)     NOT NULL,
    `user_id`      CHAR(36)     NOT NULL,
    `template_id`  CHAR(36)     NULL,
    `title`        VARCHAR(300) NOT NULL,
    `body`         TEXT         NOT NULL,
    `category`     VARCHAR(50)  NOT NULL DEFAULT 'general',
    `status`       ENUM('UNREAD','READ','SNOOZED','DISMISSED') NOT NULL DEFAULT 'UNREAD',
    `snoozed_until`   DATETIME(3) NULL,
    `read_at`         DATETIME(3) NULL,
    `is_task_reminder` BOOLEAN    NOT NULL DEFAULT FALSE,
    `entity_type`     VARCHAR(100) NULL,
    `entity_id`    VARCHAR(36)  NULL,
    `created_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    -- Inbox: ORDER BY created_at DESC WHERE user_id=? AND status IN (...)
    INDEX `notifications_inbox_idx`(`user_id`, `status`, `created_at`),
    -- Snooze wakeup job: WHERE status='SNOOZED' AND snoozed_until <= NOW()
    INDEX `notifications_snooze_idx`(`snoozed_until`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Retry schedule: RETRY_1 +5 min, RETRY_2 +15 min, RETRY_3 +60 min
-- next_retry_at is set by the delivery/retry service based on retry_count
CREATE TABLE `outbound_messages` (
    `id`                CHAR(36)     NOT NULL,
    `template_id`       CHAR(36)     NULL,
    `recipient_user_id` CHAR(36)     NULL,
    `recipient_addr`    VARCHAR(320) NOT NULL,
    `channel`           ENUM('EMAIL','IN_APP','SMS','FILE') NOT NULL,
    `subject`           VARCHAR(500) NULL,
    `rendered_body`     TEXT         NOT NULL,
    `status`            ENUM('QUEUED','RETRY_1','RETRY_2','RETRY_3','DELIVERED','FAILED','SUPPRESSED') NOT NULL DEFAULT 'QUEUED',
    `retry_count`       INT          NOT NULL DEFAULT 0,
    `next_retry_at`     DATETIME(3)  NULL,
    `delivered_at`      DATETIME(3)  NULL,
    `failed_at`         DATETIME(3)  NULL,
    `failure_reason`    TEXT         NULL,
    `is_failure_alert`  BOOLEAN      NOT NULL DEFAULT FALSE,
    `file_output_path`  VARCHAR(1000) NULL,
    `created_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    -- Pickup: WHERE status IN ('QUEUED','RETRY_1','RETRY_2','RETRY_3')
    --         AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    INDEX `outbound_messages_retry_idx`(`status`, `next_retry_at`),
    INDEX `outbound_messages_recipient_idx`(`recipient_user_id`),
    INDEX `outbound_messages_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `message_blacklist` (
    `id`         CHAR(36)     NOT NULL,
    `address`    VARCHAR(320) NOT NULL,
    `channel`    ENUM('EMAIL','IN_APP','SMS','FILE') NOT NULL,
    `user_id`    CHAR(36)     NULL,
    `reason`     VARCHAR(500) NULL,
    `created_by` CHAR(36)     NOT NULL,
    `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `message_blacklist_addr_channel_key`(`address`, `channel`),
    INDEX `message_blacklist_channel_idx`(`channel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `quiet_hours_config` (
    `id`             CHAR(36)    NOT NULL,
    `timezone`       VARCHAR(50) NOT NULL,
    `quiet_start_hr` INT         NOT NULL COMMENT '0-23 local hour',
    `quiet_end_hr`   INT         NOT NULL COMMENT '0-23 local hour',
    `is_global`      BOOLEAN     NOT NULL DEFAULT FALSE,
    `created_at`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`     DATETIME(3) NOT NULL,
    UNIQUE INDEX `quiet_hours_tz_global_key`(`timezone`, `is_global`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════════════════
-- REPORTS & ANALYTICS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE `report_definitions` (
    `id`          CHAR(36)    NOT NULL,
    `name`        VARCHAR(255) NOT NULL,
    `description` TEXT         NULL,
    `frequency`   ENUM('DAILY','WEEKLY','MONTHLY','ON_DEMAND') NOT NULL,
    `filter_json` JSON         NULL,
    `pivot_config` JSON        NULL,
    `is_active`   BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_by`  CHAR(36)     NOT NULL,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`  DATETIME(3)  NOT NULL,
    -- Report scheduler: WHERE frequency = ? AND is_active = true
    INDEX `report_defs_freq_active_idx`(`frequency`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `reports` (
    `id`            CHAR(36)    NOT NULL,
    `definition_id` CHAR(36)    NOT NULL,
    `name`          VARCHAR(255) NULL,
    `status`        ENUM('DRAFT','GENERATING','PUBLISHED','FAILED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `period_start`  DATETIME(3)  NOT NULL,
    `period_end`    DATETIME(3)  NOT NULL,
    `generated_at`  DATETIME(3)  NULL,
    `data_json`     JSON         NULL,
    `error_message` TEXT         NULL,
    `created_by`    CHAR(36)     NOT NULL,
    `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3)  NOT NULL,
    INDEX `reports_definition_created_idx`(`definition_id`, `created_at`),
    INDEX `reports_status_idx`(`status`),
    INDEX `reports_creator_status_idx`(`created_by`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `report_metric_snapshots` (
    `id`                    CHAR(36) NOT NULL,
    `report_id`             CHAR(36) NOT NULL,
    `metric_def_version_id` CHAR(36) NOT NULL,
    UNIQUE INDEX `report_metric_snapshots_key`(`report_id`, `metric_def_version_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `report_shares` (
    `id`         CHAR(36)    NOT NULL,
    `report_id`  CHAR(36)    NOT NULL,
    `user_id`    CHAR(36)    NOT NULL,
    `shared_by`  CHAR(36)    NOT NULL,
    `shared_at`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revoked_at` DATETIME(3) NULL,
    UNIQUE INDEX `report_shares_report_user_key`(`report_id`, `user_id`),
    INDEX `report_shares_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `export_requests` (
    `id`             CHAR(36)      NOT NULL,
    `report_id`      CHAR(36)      NOT NULL,
    `requested_by`   CHAR(36)      NOT NULL,
    `format`         ENUM('CSV','EXCEL','PDF') NOT NULL,
    `watermark_text` VARCHAR(500)  NULL,
    `file_path`      VARCHAR(1000) NULL,
    `status`         ENUM('PENDING','GENERATING','READY','FAILED') NOT NULL DEFAULT 'PENDING',
    `error_message`  TEXT          NULL,
    `created_at`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at`   DATETIME(3)   NULL,
    INDEX `export_requests_requested_by_idx`(`requested_by`),
    INDEX `export_requests_report_id_idx`(`report_id`),
    INDEX `export_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG — APPEND-ONLY
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE `audit_logs` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `action`      ENUM(
        'USER_CREATED','USER_UPDATED','USER_DEACTIVATED',
        'USER_ROLE_ASSIGNED','USER_ROLE_REMOVED',
        'USER_LOGGED_IN','USER_LOGGED_OUT',
        'PROPERTY_CREATED','PROPERTY_UPDATED',
        'LISTING_CREATED','LISTING_UPDATED','LISTING_LEASED','LISTING_DELISTED',
        'METRIC_DEF_CREATED','METRIC_DEF_UPDATED',
        'METRIC_DEF_VERSION_CREATED','METRIC_DEF_VERSION_LOCKED',
        'METRIC_CALC_TRIGGERED','METRIC_CALC_COMPLETED',
        'TEST_SESSION_CREATED','TEST_SESSION_UPDATED','TEST_SESSION_CANCELLED',
        'SEAT_ALLOCATION_CREATED','SEAT_ALLOCATION_CHANGED','SEAT_ALLOCATION_CANCELLED',
        'ADA_SEAT_RELEASED','ADA_SEAT_RELEASE_REVOKED',
        'REPORT_CREATED','REPORT_PUBLISHED','REPORT_SHARED','REPORT_SHARE_REVOKED',
        'REPORT_EXPORTED','REPORT_ARCHIVED',
        'NOTIFICATION_TEMPLATE_CREATED','NOTIFICATION_TEMPLATE_UPDATED',
        'BLACKLIST_ENTRY_ADDED','BLACKLIST_ENTRY_REMOVED',
        'MESSAGE_DELIVERY_FAILED','QUIET_HOURS_UPDATED'
    ) NOT NULL,
    `actor_id`    CHAR(36)     NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id`   VARCHAR(36)  NOT NULL,
    `before_json` JSON         NULL,
    `after_json`  JSON         NULL,
    `metadata`    JSON         NULL,
    `ip_address`  VARCHAR(45)  NULL,
    `request_id`  VARCHAR(36)  NULL,
    `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `audit_logs_entity_idx`(`entity_type`, `entity_id`),
    INDEX `audit_logs_actor_date_idx`(`actor_id`, `created_at`),
    INDEX `audit_logs_action_date_idx`(`action`, `created_at`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════════════════
-- FOREIGN KEYS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE `role_permissions`
    ADD CONSTRAINT `fk_rp_role`       FOREIGN KEY (`role_id`)       REFERENCES `roles`(`id`)       ON DELETE CASCADE,
    ADD CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE;

ALTER TABLE `user_roles`
    ADD CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT;

ALTER TABLE `app_sessions`
    ADD CONSTRAINT `fk_as_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `communities`
    ADD CONSTRAINT `fk_comm_region` FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE RESTRICT;

ALTER TABLE `properties`
    ADD CONSTRAINT `fk_prop_community` FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON DELETE RESTRICT;

ALTER TABLE `listings`
    ADD CONSTRAINT `fk_listing_property` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT;

ALTER TABLE `metric_definition_versions`
    ADD CONSTRAINT `fk_mdv_definition` FOREIGN KEY (`metric_definition_id`) REFERENCES `metric_definitions`(`id`) ON DELETE RESTRICT;

ALTER TABLE `metric_values`
    ADD CONSTRAINT `fk_mv_property` FOREIGN KEY (`property_id`)           REFERENCES `properties`(`id`)                  ON DELETE RESTRICT,
    ADD CONSTRAINT `fk_mv_version`  FOREIGN KEY (`metric_def_version_id`) REFERENCES `metric_definition_versions`(`id`)  ON DELETE RESTRICT;

ALTER TABLE `metric_calc_job_versions`
    ADD CONSTRAINT `fk_mcjv_job`     FOREIGN KEY (`job_id`)     REFERENCES `metric_calc_jobs`(`id`)            ON DELETE CASCADE,
    ADD CONSTRAINT `fk_mcjv_version` FOREIGN KEY (`version_id`) REFERENCES `metric_definition_versions`(`id`)  ON DELETE RESTRICT;

ALTER TABLE `test_rooms`
    ADD CONSTRAINT `fk_room_site` FOREIGN KEY (`site_id`) REFERENCES `test_sites`(`id`) ON DELETE RESTRICT;

ALTER TABLE `test_seats`
    ADD CONSTRAINT `fk_seat_room` FOREIGN KEY (`room_id`) REFERENCES `test_rooms`(`id`) ON DELETE RESTRICT;

ALTER TABLE `equipment_ledger_entries`
    ADD CONSTRAINT `fk_eq_seat` FOREIGN KEY (`seat_id`) REFERENCES `test_seats`(`id`) ON DELETE RESTRICT;

ALTER TABLE `ada_seat_releases`
    ADD CONSTRAINT `fk_ada_seat`    FOREIGN KEY (`seat_id`)     REFERENCES `test_seats`(`id`)    ON DELETE RESTRICT,
    ADD CONSTRAINT `fk_ada_session` FOREIGN KEY (`session_id`)  REFERENCES `test_sessions`(`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_ada_user`    FOREIGN KEY (`released_by`) REFERENCES `users`(`id`)         ON DELETE RESTRICT;

ALTER TABLE `test_sessions`
    ADD CONSTRAINT `fk_session_room` FOREIGN KEY (`room_id`) REFERENCES `test_rooms`(`id`) ON DELETE RESTRICT;

ALTER TABLE `test_registrations`
    ADD CONSTRAINT `fk_reg_session` FOREIGN KEY (`session_id`) REFERENCES `test_sessions`(`id`) ON DELETE RESTRICT,
    ADD CONSTRAINT `fk_reg_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)          ON DELETE RESTRICT;

ALTER TABLE `seat_allocations`
    ADD CONSTRAINT `fk_sa_session`      FOREIGN KEY (`session_id`)      REFERENCES `test_sessions`(`id`)      ON DELETE RESTRICT,
    ADD CONSTRAINT `fk_sa_registration` FOREIGN KEY (`registration_id`) REFERENCES `test_registrations`(`id`) ON DELETE RESTRICT,
    ADD CONSTRAINT `fk_sa_seat`         FOREIGN KEY (`seat_id`)         REFERENCES `test_seats`(`id`)         ON DELETE RESTRICT,
    ADD CONSTRAINT `fk_sa_user`         FOREIGN KEY (`user_id`)         REFERENCES `users`(`id`)              ON DELETE RESTRICT;

ALTER TABLE `notifications`
    ADD CONSTRAINT `fk_notif_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`(`id`)                  ON DELETE CASCADE,
    ADD CONSTRAINT `fk_notif_template` FOREIGN KEY (`template_id`) REFERENCES `notification_templates`(`id`) ON DELETE SET NULL;

ALTER TABLE `outbound_messages`
    ADD CONSTRAINT `fk_om_template` FOREIGN KEY (`template_id`) REFERENCES `notification_templates`(`id`) ON DELETE SET NULL;

ALTER TABLE `message_blacklist`
    ADD CONSTRAINT `fk_bl_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

ALTER TABLE `report_definitions`
    ADD CONSTRAINT `fk_rd_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT;

ALTER TABLE `reports`
    ADD CONSTRAINT `fk_r_definition` FOREIGN KEY (`definition_id`) REFERENCES `report_definitions`(`id`) ON DELETE RESTRICT,
    ADD CONSTRAINT `fk_r_creator`    FOREIGN KEY (`created_by`)    REFERENCES `users`(`id`)              ON DELETE RESTRICT;

ALTER TABLE `report_metric_snapshots`
    ADD CONSTRAINT `fk_rms_report`  FOREIGN KEY (`report_id`)             REFERENCES `reports`(`id`)                   ON DELETE CASCADE,
    ADD CONSTRAINT `fk_rms_version` FOREIGN KEY (`metric_def_version_id`) REFERENCES `metric_definition_versions`(`id`) ON DELETE RESTRICT;

ALTER TABLE `report_shares`
    ADD CONSTRAINT `fk_rs_report`    FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_rs_recipient` FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`)   ON DELETE RESTRICT,
    ADD CONSTRAINT `fk_rs_sharer`    FOREIGN KEY (`shared_by`) REFERENCES `users`(`id`)   ON DELETE RESTRICT;

ALTER TABLE `export_requests`
    ADD CONSTRAINT `fk_er_report`    FOREIGN KEY (`report_id`)    REFERENCES `reports`(`id`) ON DELETE RESTRICT,
    ADD CONSTRAINT `fk_er_requestor` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`)  ON DELETE RESTRICT;

ALTER TABLE `audit_logs`
    ADD CONSTRAINT `fk_al_actor` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG IMMUTABILITY TRIGGERS
-- Any UPDATE or DELETE on audit_logs raises SQLSTATE '45000'.
-- The application layer enforces append-only at the service level as well.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TRIGGER `trg_audit_logs_no_update`
BEFORE UPDATE ON `audit_logs`
FOR EACH ROW
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'audit_logs are immutable: UPDATE is not permitted';

CREATE TRIGGER `trg_audit_logs_no_delete`
BEFORE DELETE ON `audit_logs`
FOR EACH ROW
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'audit_logs are immutable: DELETE is not permitted';
