ALTER TABLE `conversations` ADD COLUMN `isArchived` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `conversations` ADD COLUMN `archivedAt` timestamp;
