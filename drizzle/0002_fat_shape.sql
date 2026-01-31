ALTER TABLE `integrations` MODIFY COLUMN `provider` enum('google','amplemarket','whatsapp','apollo') NOT NULL;--> statement-breakpoint
ALTER TABLE `moments` MODIFY COLUMN `type` enum('email_sent','email_received','reply_received','call_completed','meeting_held','note_added','signal_detected','lead_captured','deal_won','deal_lost') NOT NULL;--> statement-breakpoint
ALTER TABLE `threads` MODIFY COLUMN `status` enum('active','waiting','dormant','closed') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `moments` ADD `externalId` varchar(255);--> statement-breakpoint
ALTER TABLE `moments` ADD `externalSource` varchar(50);--> statement-breakpoint
ALTER TABLE `nextActions` ADD `assignedUserId` int;--> statement-breakpoint
ALTER TABLE `nextActions` ADD `dueAt` timestamp;--> statement-breakpoint
ALTER TABLE `threads` ADD `ownerUserId` int;--> statement-breakpoint
ALTER TABLE `threads` ADD `collaboratorUserIds` json;--> statement-breakpoint
ALTER TABLE `threads` ADD `visibility` varchar(20) DEFAULT 'private';--> statement-breakpoint
ALTER TABLE `threads` ADD `dealSignal` json;--> statement-breakpoint
CREATE INDEX `tenant_assigned_idx` ON `nextActions` (`tenantId`,`assignedUserId`,`status`);--> statement-breakpoint
CREATE INDEX `tenant_due_idx` ON `nextActions` (`tenantId`,`dueAt`);--> statement-breakpoint
CREATE INDEX `tenant_owner_idx` ON `threads` (`tenantId`,`ownerUserId`);--> statement-breakpoint
CREATE INDEX `tenant_visibility_idx` ON `threads` (`tenantId`,`visibility`);