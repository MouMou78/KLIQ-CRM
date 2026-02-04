CREATE TABLE `leadScores` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`personId` varchar(36) NOT NULL,
	`engagementScore` int NOT NULL DEFAULT 0,
	`demographicScore` int NOT NULL DEFAULT 0,
	`behaviorScore` int NOT NULL DEFAULT 0,
	`totalScore` int NOT NULL DEFAULT 0,
	`emailOpens` int NOT NULL DEFAULT 0,
	`emailClicks` int NOT NULL DEFAULT 0,
	`emailReplies` int NOT NULL DEFAULT 0,
	`websiteVisits` int NOT NULL DEFAULT 0,
	`formSubmissions` int NOT NULL DEFAULT 0,
	`lastActivityAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadScoringRules` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` enum('engagement','demographic','behavior') NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`points` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadScoringRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `lead_scores_tenant_idx` ON `leadScores` (`tenantId`);--> statement-breakpoint
CREATE INDEX `lead_scores_person_idx` ON `leadScores` (`personId`);--> statement-breakpoint
CREATE INDEX `lead_scores_total_idx` ON `leadScores` (`totalScore`);--> statement-breakpoint
CREATE INDEX `lead_scoring_rules_tenant_idx` ON `leadScoringRules` (`tenantId`);--> statement-breakpoint
CREATE INDEX `lead_scoring_rules_category_idx` ON `leadScoringRules` (`category`);