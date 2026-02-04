CREATE TABLE `tasks` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` enum('todo','in_progress','completed','cancelled') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`dueDate` timestamp,
	`assignedToId` varchar(36),
	`createdById` varchar(36) NOT NULL,
	`linkedEntityType` enum('deal','contact','account'),
	`linkedEntityId` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tasks_tenant_idx` ON `tasks` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tasks_assigned_idx` ON `tasks` (`assignedToId`);--> statement-breakpoint
CREATE INDEX `tasks_due_idx` ON `tasks` (`dueDate`);--> statement-breakpoint
CREATE INDEX `tasks_linked_idx` ON `tasks` (`linkedEntityType`,`linkedEntityId`);