CREATE TABLE `aiConversations` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`messages` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `user_conversations_idx` ON `aiConversations` (`userId`);--> statement-breakpoint
CREATE INDEX `tenant_conversations_idx` ON `aiConversations` (`tenantId`);--> statement-breakpoint
CREATE INDEX `updated_conversations_idx` ON `aiConversations` (`updatedAt`);