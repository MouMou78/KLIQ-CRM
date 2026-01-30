CREATE TABLE `events` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`slug` varchar(100) NOT NULL,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`formSchema` json,
	`defaultIntent` text NOT NULL DEFAULT ('warm_intro'),
	`defaultTags` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_slug_unique` UNIQUE(`tenantId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`provider` enum('google','amplemarket') NOT NULL,
	`status` enum('connected','disconnected','error') NOT NULL DEFAULT 'disconnected',
	`config` json DEFAULT ('{}'),
	`oauthTokens` json,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_provider_unique` UNIQUE(`tenantId`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `moments` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`threadId` varchar(36) NOT NULL,
	`personId` varchar(36) NOT NULL,
	`source` text NOT NULL,
	`type` enum('email_sent','email_received','reply_received','call_completed','meeting_held','note_added','signal_detected','lead_captured') NOT NULL,
	`timestamp` timestamp NOT NULL,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nextActions` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`threadId` varchar(36) NOT NULL,
	`actionType` text NOT NULL,
	`triggerType` text NOT NULL,
	`triggerValue` text NOT NULL,
	`status` enum('open','completed','cancelled') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `nextActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`fullName` text NOT NULL,
	`primaryEmail` varchar(320) NOT NULL,
	`secondaryEmails` json DEFAULT ('[]'),
	`companyName` text,
	`roleTitle` text,
	`phone` varchar(50),
	`tags` json DEFAULT ('[]'),
	`enrichmentSource` text,
	`enrichmentSnapshot` json,
	`enrichmentLastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `people_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_primary_email_unique` UNIQUE(`tenantId`,`primaryEmail`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`domain` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `threads` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`personId` varchar(36) NOT NULL,
	`source` text NOT NULL,
	`intent` text NOT NULL,
	`status` enum('active','dormant','closed') NOT NULL DEFAULT 'active',
	`title` text,
	`lastActivityAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` text NOT NULL,
	`role` enum('owner','collaborator','restricted') NOT NULL DEFAULT 'owner',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_email_unique` UNIQUE(`tenantId`,`email`)
);
--> statement-breakpoint
CREATE INDEX `tenant_thread_timestamp_idx` ON `moments` (`tenantId`,`threadId`,`timestamp`);--> statement-breakpoint
CREATE INDEX `tenant_person_timestamp_idx` ON `moments` (`tenantId`,`personId`,`timestamp`);--> statement-breakpoint
CREATE INDEX `tenant_status_idx` ON `nextActions` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `tenant_thread_status_idx` ON `nextActions` (`tenantId`,`threadId`,`status`);--> statement-breakpoint
CREATE INDEX `tenant_name_idx` ON `people` (`tenantId`,`fullName`);--> statement-breakpoint
CREATE INDEX `domain_idx` ON `tenants` (`domain`);--> statement-breakpoint
CREATE INDEX `tenant_person_idx` ON `threads` (`tenantId`,`personId`);--> statement-breakpoint
CREATE INDEX `tenant_status_idx` ON `threads` (`tenantId`,`status`);