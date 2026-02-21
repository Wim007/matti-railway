DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('user', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."ageGroup" AS ENUM('12-13', '14-15', '16-17', '18-21');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."gender" AS ENUM('boy', 'girl', 'other', 'prefer_not_to_say', 'none');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."theme" AS ENUM('general', 'school', 'friends', 'home', 'feelings', 'love', 'freetime', 'future', 'self', 'bullying');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."bullyingSeverity" AS ENUM('low', 'medium', 'high');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."outcome" AS ENUM('unresolved', 'in_progress', 'resolved', 'escalated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status" AS ENUM('pending', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."followUpStatus" AS ENUM('pending', 'sent', 'responded', 'skipped');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."rating" AS ENUM('up', 'down');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"openId" varchar(64) NOT NULL UNIQUE,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"age" integer,
	"birthYear" integer,
	"birthdate" varchar(10),
	"ageGroup" "ageGroup",
	"postalCode" varchar(10),
	"gender" "gender" DEFAULT 'none',
	"analyticsConsent" boolean DEFAULT false NOT NULL,
	"themeSuggestionsEnabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "themes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"userId" varchar(255) NOT NULL,
	"currentTheme" "theme" DEFAULT 'general' NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"userId" varchar(255) NOT NULL,
	"themeId" "theme" NOT NULL,
	"threadId" varchar(255),
	"summary" text,
	"messages" json NOT NULL,
	"bullyingDetected" boolean DEFAULT false NOT NULL,
	"bullyingSeverity" "bullyingSeverity",
	"bullyingFollowUpScheduled" boolean DEFAULT false NOT NULL,
	"initialProblem" text,
	"conversationCount" integer DEFAULT 0 NOT NULL,
	"interventionStartDate" timestamp,
	"interventionEndDate" timestamp,
	"outcome" "outcome" DEFAULT 'in_progress',
	"resolution" text,
	"actionCompletionRate" integer DEFAULT 0 NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"archivedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "actions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"userId" varchar(255) NOT NULL,
	"themeId" "theme" NOT NULL,
	"conversationId" integer,
	"actionText" text NOT NULL,
	"actionType" varchar(100),
	"status" "status" DEFAULT 'pending' NOT NULL,
	"followUpScheduled" timestamp,
	"followUpIntervals" json,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"userId" integer NOT NULL,
	"lastActive" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"userId" integer NOT NULL,
	"themeId" "theme",
	"conversationId" integer,
	"threadId" varchar(255),
	"initialProblem" text,
	"messageCount" integer DEFAULT 0,
	"durationMinutes" integer DEFAULT 0,
	"outcome" text,
	"rewardsEarned" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "followUps" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"actionId" integer NOT NULL REFERENCES "actions"("id"),
	"scheduledFor" timestamp NOT NULL,
	"status" "followUpStatus" DEFAULT 'pending' NOT NULL,
	"notificationSent" timestamp,
	"response" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messageFeedback" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"conversationId" integer NOT NULL REFERENCES "conversations"("id"),
	"userId" varchar(255) NOT NULL,
	"messageIndex" integer NOT NULL,
	"rating" "rating" NOT NULL,
	"feedbackText" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
