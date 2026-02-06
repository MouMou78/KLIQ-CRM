ALTER TABLE `accounts` ADD `integrationId` varchar(36);--> statement-breakpoint
ALTER TABLE `accounts` ADD `amplemarketUserId` varchar(100);--> statement-breakpoint
ALTER TABLE `accounts` ADD `amplemarketExternalId` varchar(100);--> statement-breakpoint
ALTER TABLE `people` ADD `integrationId` varchar(36);--> statement-breakpoint
ALTER TABLE `people` ADD `amplemarketUserId` varchar(100);--> statement-breakpoint
ALTER TABLE `people` ADD `amplemarketExternalId` varchar(100);