CREATE TABLE `templateAnalytics` (
	`id` varchar(36) NOT NULL,
	`templateId` varchar(100) NOT NULL,
	`installCount` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`failureCount` int NOT NULL DEFAULT 0,
	`lastInstalledAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templateAnalytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `templateAnalytics_templateId_unique` UNIQUE(`templateId`)
);
--> statement-breakpoint
CREATE TABLE `templateReviews` (
	`id` varchar(36) NOT NULL,
	`templateId` varchar(100) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`rating` int NOT NULL,
	`review` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `templateReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userTemplates` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` enum('lead_nurturing','deal_management','task_automation','notifications') NOT NULL,
	`triggerType` enum('email_opened','email_replied','no_reply_after_days','meeting_held','stage_entered','deal_value_threshold','scheduled') NOT NULL,
	`triggerConfig` json DEFAULT ('{}'),
	`actionType` enum('move_stage','send_notification','create_task','enroll_sequence','update_field') NOT NULL,
	`actionConfig` json DEFAULT ('{}'),
	`conditions` json DEFAULT ('{"logic":"AND","rules":[]}'),
	`priority` int NOT NULL DEFAULT 0,
	`isPublic` boolean NOT NULL DEFAULT false,
	`baseTemplateId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `template_idx` ON `templateAnalytics` (`templateId`);--> statement-breakpoint
CREATE INDEX `template_idx` ON `templateReviews` (`templateId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `templateReviews` (`userId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `userTemplates` (`userId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `userTemplates` (`tenantId`);--> statement-breakpoint
CREATE INDEX `public_idx` ON `userTemplates` (`isPublic`);