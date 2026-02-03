CREATE TABLE `automationExecutions` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`ruleId` varchar(36) NOT NULL,
	`threadId` varchar(36),
	`personId` varchar(36),
	`status` enum('success','failed','skipped') NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`errorMessage` text,
	`metadata` json DEFAULT ('{}'),
	CONSTRAINT `automationExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automationRules` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`triggerType` enum('email_opened','email_replied','no_reply_after_days','meeting_held','stage_entered','deal_value_threshold') NOT NULL,
	`triggerConfig` json DEFAULT ('{}'),
	`actionType` enum('move_stage','send_notification','create_task','enroll_sequence','update_field') NOT NULL,
	`actionConfig` json DEFAULT ('{}'),
	`status` enum('active','paused') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automationRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSequenceEnrollments` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`sequenceId` varchar(36) NOT NULL,
	`personId` varchar(36) NOT NULL,
	`threadId` varchar(36),
	`currentStep` int NOT NULL DEFAULT 0,
	`status` enum('active','completed','paused','unsubscribed') NOT NULL DEFAULT 'active',
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`lastEmailSentAt` timestamp,
	`nextEmailScheduledAt` timestamp,
	`totalOpens` int NOT NULL DEFAULT 0,
	`totalReplies` int NOT NULL DEFAULT 0,
	CONSTRAINT `emailSequenceEnrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSequenceEvents` (
	`id` varchar(36) NOT NULL,
	`enrollmentId` varchar(36) NOT NULL,
	`stepNumber` int NOT NULL,
	`eventType` enum('sent','opened','replied','bounced','unsubscribed') NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`metadata` json DEFAULT ('{}'),
	CONSTRAINT `emailSequenceEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSequenceSteps` (
	`id` varchar(36) NOT NULL,
	`sequenceId` varchar(36) NOT NULL,
	`stepNumber` int NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`delayDays` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailSequenceSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSequences` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` enum('active','paused','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailSequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tenant_rule_idx` ON `automationExecutions` (`tenantId`,`ruleId`);--> statement-breakpoint
CREATE INDEX `tenant_thread_idx` ON `automationExecutions` (`tenantId`,`threadId`);--> statement-breakpoint
CREATE INDEX `tenant_executed_idx` ON `automationExecutions` (`tenantId`,`executedAt`);--> statement-breakpoint
CREATE INDEX `tenant_status_idx` ON `automationRules` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `tenant_trigger_idx` ON `automationRules` (`tenantId`,`triggerType`);--> statement-breakpoint
CREATE INDEX `tenant_sequence_idx` ON `emailSequenceEnrollments` (`tenantId`,`sequenceId`);--> statement-breakpoint
CREATE INDEX `tenant_person_idx` ON `emailSequenceEnrollments` (`tenantId`,`personId`);--> statement-breakpoint
CREATE INDEX `tenant_status_idx` ON `emailSequenceEnrollments` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `tenant_scheduled_idx` ON `emailSequenceEnrollments` (`tenantId`,`nextEmailScheduledAt`);--> statement-breakpoint
CREATE INDEX `enrollment_timestamp_idx` ON `emailSequenceEvents` (`enrollmentId`,`timestamp`);--> statement-breakpoint
CREATE INDEX `enrollment_step_idx` ON `emailSequenceEvents` (`enrollmentId`,`stepNumber`);--> statement-breakpoint
CREATE INDEX `sequence_step_idx` ON `emailSequenceSteps` (`sequenceId`,`stepNumber`);--> statement-breakpoint
CREATE INDEX `tenant_status_idx` ON `emailSequences` (`tenantId`,`status`);