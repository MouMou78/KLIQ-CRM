ALTER TABLE `messages` ADD `fileUrl` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `fileName` varchar(255);--> statement-breakpoint
ALTER TABLE `messages` ADD `fileType` varchar(100);--> statement-breakpoint
ALTER TABLE `messages` ADD `fileSize` int;