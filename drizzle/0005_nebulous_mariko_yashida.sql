ALTER TABLE `conversations` ADD `bullyingDetected` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `conversations` ADD `bullyingSeverity` enum('low','medium','high');--> statement-breakpoint
ALTER TABLE `conversations` ADD `bullyingFollowUpScheduled` boolean DEFAULT false NOT NULL;