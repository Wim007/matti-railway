ALTER TABLE `conversations` ADD `initialProblem` text;--> statement-breakpoint
ALTER TABLE `conversations` ADD `conversationCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `conversations` ADD `interventionStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `conversations` ADD `interventionEndDate` timestamp;--> statement-breakpoint
ALTER TABLE `conversations` ADD `outcome` enum('unresolved','in_progress','resolved','escalated') DEFAULT 'in_progress';--> statement-breakpoint
ALTER TABLE `conversations` ADD `resolution` text;--> statement-breakpoint
ALTER TABLE `conversations` ADD `actionCompletionRate` int DEFAULT 0 NOT NULL;