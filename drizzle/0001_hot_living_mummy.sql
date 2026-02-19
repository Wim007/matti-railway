CREATE TABLE `actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`themeId` enum('general','school','friends','home','feelings','love','freetime','future','self') NOT NULL,
	`conversationId` int,
	`actionText` text NOT NULL,
	`actionType` varchar(100),
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`followUpScheduled` timestamp,
	`followUpIntervals` json,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`themeId` enum('general','school','friends','home','feelings','love','freetime','future','self'),
	`conversationId` int,
	`threadId` varchar(255),
	`initialProblem` text,
	`messageCount` int DEFAULT 0,
	`durationMinutes` int DEFAULT 0,
	`outcome` text,
	`rewardsEarned` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`themeId` enum('general','school','friends','home','feelings','love','freetime','future','self') NOT NULL,
	`threadId` varchar(255),
	`summary` text,
	`messages` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lastActive` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `themes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentTheme` enum('general','school','friends','home','feelings','love','freetime','future','self') NOT NULL DEFAULT 'general',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `themes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `age` int;--> statement-breakpoint
ALTER TABLE `users` ADD `birthYear` int;--> statement-breakpoint
ALTER TABLE `users` ADD `birthdate` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `ageGroup` enum('12-13','14-15','16-17','18-21');--> statement-breakpoint
ALTER TABLE `users` ADD `postalCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('boy','girl','other','prefer_not_to_say','none') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `users` ADD `analyticsConsent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `themeSuggestionsEnabled` boolean DEFAULT true NOT NULL;