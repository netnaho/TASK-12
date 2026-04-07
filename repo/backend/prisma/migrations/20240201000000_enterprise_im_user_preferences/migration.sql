-- Add ENTERPRISE_IM to NotificationChannel enum (used by templates, outbound_messages, message_blacklist)
ALTER TABLE `notification_templates`
  MODIFY `channel` ENUM('EMAIL','IN_APP','SMS','FILE','ENTERPRISE_IM') NOT NULL;

ALTER TABLE `outbound_messages`
  MODIFY `channel` ENUM('EMAIL','IN_APP','SMS','FILE','ENTERPRISE_IM') NOT NULL;

ALTER TABLE `message_blacklist`
  MODIFY `channel` ENUM('EMAIL','IN_APP','SMS','FILE','ENTERPRISE_IM') NOT NULL;

-- Add DeliveryMode enum and user_preferences table
CREATE TABLE `user_preferences` (
  `user_id`       CHAR(36)                              NOT NULL,
  `delivery_mode` ENUM('IN_APP_ONLY','ALSO_PACKAGE')   NOT NULL DEFAULT 'IN_APP_ONLY',
  `created_at`    DATETIME(3)                           NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)                           NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_preferences_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
