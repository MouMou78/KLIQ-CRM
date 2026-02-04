CREATE TABLE `documentFolders` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`parentFolderId` varchar(36),
	`createdById` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentFolders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentVersions` (
	`id` varchar(36) NOT NULL,
	`documentId` varchar(36) NOT NULL,
	`version` int NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`uploadedById` varchar(36) NOT NULL,
	`changeNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(500) NOT NULL,
	`description` text,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`version` int NOT NULL DEFAULT 1,
	`linkedEntityType` enum('contact','account','deal','task'),
	`linkedEntityId` varchar(36),
	`folderId` varchar(36),
	`uploadedById` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `document_folders_tenant_idx` ON `documentFolders` (`tenantId`);--> statement-breakpoint
CREATE INDEX `document_folders_parent_idx` ON `documentFolders` (`parentFolderId`);--> statement-breakpoint
CREATE INDEX `document_versions_document_idx` ON `documentVersions` (`documentId`);--> statement-breakpoint
CREATE INDEX `document_versions_version_idx` ON `documentVersions` (`documentId`,`version`);--> statement-breakpoint
CREATE INDEX `documents_tenant_idx` ON `documents` (`tenantId`);--> statement-breakpoint
CREATE INDEX `documents_entity_idx` ON `documents` (`linkedEntityType`,`linkedEntityId`);--> statement-breakpoint
CREATE INDEX `documents_folder_idx` ON `documents` (`folderId`);--> statement-breakpoint
CREATE INDEX `documents_uploader_idx` ON `documents` (`uploadedById`);