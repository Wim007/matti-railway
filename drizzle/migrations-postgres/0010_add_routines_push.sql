-- Migration: Add routines and pushSubscriptions tables

CREATE TABLE IF NOT EXISTS "routines" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "userId" varchar(255) NOT NULL UNIQUE,
  "sleepEnabled" boolean NOT NULL DEFAULT false,
  "bedtime" varchar(5) NOT NULL DEFAULT '22:00',
  "wakeTime" varchar(5) NOT NULL DEFAULT '07:00',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pushSubscriptions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "userId" varchar(255) NOT NULL UNIQUE,
  "subscription" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
