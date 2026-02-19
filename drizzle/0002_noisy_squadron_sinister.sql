CREATE TABLE `followUps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` int NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('pending','sent','responded','skipped') NOT NULL DEFAULT 'pending',
	`notificationSent` timestamp,
	`response` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `followUps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `followUps` ADD CONSTRAINT `followUps_actionId_actions_id_fk` FOREIGN KEY (`actionId`) REFERENCES `actions`(`id`) ON DELETE no action ON UPDATE no action;