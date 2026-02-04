CREATE TABLE `calendarEvents` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`integrationId` varchar(36) NOT NULL,
	`externalEventId` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`location` text,
	`attendees` json DEFAULT ('[]'),
	`isAllDay` boolean NOT NULL DEFAULT false,
	`status` enum('confirmed','tentative','cancelled') NOT NULL DEFAULT 'confirmed',
	`linkedContactId` varchar(36),
	`linkedAccountId` varchar(36),
	`linkedDealId` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendarEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendarIntegrations` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`provider` enum('google','outlook') NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`expiresAt` timestamp,
	`calendarId` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendarIntegrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `calendar_events_tenant_idx` ON `calendarEvents` (`tenantId`);--> statement-breakpoint
CREATE INDEX `calendar_events_integration_idx` ON `calendarEvents` (`integrationId`);--> statement-breakpoint
CREATE INDEX `calendar_events_external_idx` ON `calendarEvents` (`externalEventId`);--> statement-breakpoint
CREATE INDEX `calendar_events_start_idx` ON `calendarEvents` (`startTime`);--> statement-breakpoint
CREATE INDEX `calendar_events_contact_idx` ON `calendarEvents` (`linkedContactId`);--> statement-breakpoint
CREATE INDEX `calendar_integrations_tenant_idx` ON `calendarIntegrations` (`tenantId`);--> statement-breakpoint
CREATE INDEX `calendar_integrations_user_idx` ON `calendarIntegrations` (`userId`);