ALTER TABLE `amplemarketSyncLogs` ADD `contactsSkipped` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `amplemarketSyncLogs` ADD `contactsFetched` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `amplemarketSyncLogs` ADD `contactsKept` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `amplemarketSyncLogs` ADD `contactsDiscarded` int DEFAULT 0;