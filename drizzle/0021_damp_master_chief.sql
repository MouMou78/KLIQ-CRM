CREATE TABLE `emailTemplates` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`subject` text NOT NULL,
	`content` json NOT NULL,
	`variables` json DEFAULT ('[]'),
	`category` varchar(100),
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdById` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `email_templates_tenant_idx` ON `emailTemplates` (`tenantId`);--> statement-breakpoint
CREATE INDEX `email_templates_category_idx` ON `emailTemplates` (`category`);