CREATE TABLE `messageFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` varchar(255) NOT NULL,
	`messageIndex` int NOT NULL,
	`rating` enum('up','down') NOT NULL,
	`feedbackText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `messageFeedback` ADD CONSTRAINT `messageFeedback_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;