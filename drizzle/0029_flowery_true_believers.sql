ALTER TABLE `tasks` ADD `reminderAt` timestamp;--> statement-breakpoint
ALTER TABLE `tasks` ADD `reminderSent` boolean DEFAULT false NOT NULL;