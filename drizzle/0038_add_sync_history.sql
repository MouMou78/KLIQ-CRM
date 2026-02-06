CREATE TABLE `syncHistory` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `provider` varchar(50) NOT NULL,
  `syncType` varchar(50) NOT NULL,
  `status` enum('success', 'partial', 'failed') NOT NULL,
  `recordsSynced` int NOT NULL DEFAULT 0,
  `conflictsResolved` int NOT NULL DEFAULT 0,
  `errors` json DEFAULT NULL,
  `config` json DEFAULT NULL,
  `startedAt` datetime NOT NULL,
  `completedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
