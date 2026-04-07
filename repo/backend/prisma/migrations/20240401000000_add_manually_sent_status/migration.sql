-- Migration: Add MANUALLY_SENT to DeliveryStatus enum
--
-- Context: The service layer and validation schema have always treated
-- MANUALLY_SENT as a valid status (for operator-recorded package deliveries),
-- but the DB enum never included it, causing a constraint violation if
-- updateDeliveryStatus was called with status='MANUALLY_SENT'.
--
-- Safe rollout: MySQL ENUM extension is a metadata-only change (no table
-- rebuild, no row lock). Safe to run on a live table.
--
-- Rollback note: The reverse ALTER is only safe if NO rows currently have
-- status='MANUALLY_SENT'. Run before rolling back:
--   SELECT COUNT(*) FROM outbound_messages WHERE status = 'MANUALLY_SENT';
-- If that returns 0, the rollback ALTER below is safe.
--
-- Rollback SQL (only if count above is 0):
--   ALTER TABLE `outbound_messages` MODIFY COLUMN `status`
--     ENUM('QUEUED','RETRY_1','RETRY_2','RETRY_3','DELIVERED','FAILED','SUPPRESSED')
--     NOT NULL DEFAULT 'QUEUED';

ALTER TABLE `outbound_messages` MODIFY COLUMN `status`
  ENUM('QUEUED','RETRY_1','RETRY_2','RETRY_3','DELIVERED','FAILED','SUPPRESSED','MANUALLY_SENT')
  NOT NULL DEFAULT 'QUEUED';
