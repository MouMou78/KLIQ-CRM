CREATE TABLE `emailExamples` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`context` text,
	`category` varchar(100),
	`performanceMetrics` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailExamples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `email_examples_user_idx` ON `emailExamples` (`userId`);--> statement-breakpoint
CREATE INDEX `email_examples_category_idx` ON `emailExamples` (`category`);