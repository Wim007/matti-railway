import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/pg-core";

// Enums for PostgreSQL
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const ageGroupEnum = pgEnum("ageGroup", ["12-13", "14-15", "16-17", "18-21"]);
export const genderEnum = pgEnum("gender", ["boy", "girl", "other", "prefer_not_to_say", "none"]);
export const themeEnum = pgEnum("theme", [
  "general",
  "school",
  "friends",
  "home",
  "feelings",
  "love",
  "freetime",
  "future",
  "self",
  "bullying"
]);
export const bullyingSeverityEnum = pgEnum("bullyingSeverity", ["low", "medium", "high"]);
export const outcomeEnum = pgEnum("outcome", ["unresolved", "in_progress", "resolved", "escalated"]);
export const statusEnum = pgEnum("status", ["pending", "completed", "cancelled"]);
export const followUpStatusEnum = pgEnum("followUpStatus", ["pending", "sent", "responded", "skipped"]);
export const ratingEnum = pgEnum("rating", ["up", "down"]);

/**
 * Core user table backing auth flow.
 * Extended with Matti-specific fields for youth profiles.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  
  // Matti-specific fields
  age: integer("age"),
  birthYear: integer("birthYear"),
  birthdate: varchar("birthdate", { length: 10 }), // ISO date YYYY-MM-DD
  ageGroup: ageGroupEnum("ageGroup"),
  postalCode: varchar("postalCode", { length: 10 }),
  gender: genderEnum("gender").default("none"),
  analyticsConsent: boolean("analyticsConsent").default(false).notNull(),
  themeSuggestionsEnabled: boolean("themeSuggestionsEnabled").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Themes table - tracks current theme selection per user
 */
export const themes = pgTable("themes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).notNull(),
  currentTheme: themeEnum("currentTheme").default("general").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Conversations table - stores chat conversations per theme
 * Each theme has its own conversation history
 */
export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).notNull(),
  themeId: themeEnum("themeId").notNull(),
  threadId: varchar("threadId", { length: 255 }), // OpenAI thread ID
  summary: text("summary"), // Conversation summary for context
  messages: json("messages").$type<Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>>().notNull(), // Full message history as JSON
  bullyingDetected: boolean("bullyingDetected").default(false).notNull(), // Bullying flag
  bullyingSeverity: bullyingSeverityEnum("bullyingSeverity"), // Severity level
  bullyingFollowUpScheduled: boolean("bullyingFollowUpScheduled").default(false).notNull(), // Follow-up scheduled
  // Outcome tracking fields
  initialProblem: text("initialProblem"), // e.g., "Gepest door klasgenoten"
  conversationCount: integer("conversationCount").default(0).notNull(), // Number of follow-up conversations
  interventionStartDate: timestamp("interventionStartDate"), // When problem was first detected
  interventionEndDate: timestamp("interventionEndDate"), // When problem was resolved
  outcome: outcomeEnum("outcome").default("in_progress"), // Current status
  resolution: text("resolution"), // e.g., "Kan nu beter voor zichzelf opkomen"
  actionCompletionRate: integer("actionCompletionRate").default(0).notNull(), // Percentage of actions completed (0-100)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Actions table - tracks detected actions and follow-ups
 */
export const actions = pgTable("actions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).notNull(),
  themeId: themeEnum("themeId").notNull(),
  conversationId: integer("conversationId"),
  actionText: text("actionText").notNull(), // Description of the action
  actionType: varchar("actionType", { length: 100 }), // Type of action detected
  status: statusEnum("status").default("pending").notNull(),
  followUpScheduled: timestamp("followUpScheduled"), // When follow-up is scheduled
  followUpIntervals: json("followUpIntervals").$type<number[]>(), // Array of intervals in days [2, 4, 7, 10, 14, 21]
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Sessions table - tracks user sessions for timeout logic
 */
export const sessions = pgTable("sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  lastActive: timestamp("lastActive").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Analytics table - tracks conversation metrics for dashboard reporting
 */
export const analytics = pgTable("analytics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  themeId: themeEnum("themeId"),
  conversationId: integer("conversationId"),
  threadId: varchar("threadId", { length: 255 }),
  initialProblem: text("initialProblem"), // Starting issue/topic
  messageCount: integer("messageCount").default(0),
  durationMinutes: integer("durationMinutes").default(0),
  outcome: text("outcome"), // Final resolution or status
  rewardsEarned: integer("rewardsEarned").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Follow-ups table - scheduled check-ins for actions
 * Implements intelligent intervals (Day 2, 4, 7, 10, 14, 21)
 */
export const followUps = pgTable("followUps", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  actionId: integer("actionId").notNull().references(() => actions.id),
  scheduledFor: timestamp("scheduledFor").notNull(),
  status: followUpStatusEnum("status").default("pending").notNull(),
  notificationSent: timestamp("notificationSent"),
  response: text("response"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Message Feedback table - tracks thumbs up/down feedback on AI responses
 */
export const messageFeedback = pgTable("messageFeedback", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversationId").notNull().references(() => conversations.id),
  userId: varchar("userId", { length: 255 }).notNull(),
  messageIndex: integer("messageIndex").notNull(), // Index of the AI message in conversation
  rating: ratingEnum("rating").notNull(),
  feedbackText: text("feedbackText"), // Optional text when rating is "down"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Theme = typeof themes.$inferSelect;
export type InsertTheme = typeof themes.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Action = typeof actions.$inferSelect;
export type InsertAction = typeof actions.$inferInsert;
export type FollowUp = typeof followUps.$inferSelect;
export type InsertFollowUp = typeof followUps.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;
export type MessageFeedback = typeof messageFeedback.$inferSelect;
export type InsertMessageFeedback = typeof messageFeedback.$inferInsert;
