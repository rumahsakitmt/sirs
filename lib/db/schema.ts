import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { TemplateSchema } from "@/lib/template-types";

// ============================================
// Better Auth Tables
// ============================================


export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role").default("staff").notNull(),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);



// ============================================
// Application Tables
// ============================================

export const room = pgTable("room", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reportTemplate = pgTable("report_template", {
  id: text("id").primaryKey(),
  roomId: text("room_id").references(() => room.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'simple_list' | 'matrix'
  periodType: text("period_type").notNull().default("monthly"), // 'daily' | 'monthly'
  schema: jsonb("schema").$type<TemplateSchema>().notNull(), // The template structure
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by").references(() => user.id),
});

export const report = pgTable("report", {
  id: text("id").primaryKey(),
  templateId: text("template_id")
    .notNull()
    .references(() => reportTemplate.id, { onDelete: "restrict" }),
  roomId: text("room_id")
    .notNull()
    .references(() => room.id, { onDelete: "restrict" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  periodDay: integer("period_day"), // null for monthly reports
  data: jsonb("data").$type<Record<string, unknown>>().notNull(), // The actual report data
  status: text("status").notNull().default("draft"), // 'draft' | 'submitted'
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userRoom = pgTable(
  "user_room",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roomId: text("room_id")
      .notNull()
      .references(() => room.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roomId] }),
  ],
);

// ============================================
// Relations
// ============================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  reports: many(report),
  userRooms: many(userRoom),
  createdTemplates: many(reportTemplate),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const roomRelations = relations(room, ({ many }) => ({
  templates: many(reportTemplate),
  reports: many(report),
  userRooms: many(userRoom),
}));

export const reportTemplateRelations = relations(
  reportTemplate,
  ({ one, many }) => ({
    room: one(room, {
      fields: [reportTemplate.roomId],
      references: [room.id],
    }),
    createdBy: one(user, {
      fields: [reportTemplate.createdBy],
      references: [user.id],
    }),
    reports: many(report),
  }),
);

export const reportRelations = relations(report, ({ one }) => ({
  template: one(reportTemplate, {
    fields: [report.templateId],
    references: [reportTemplate.id],
  }),
  room: one(room, {
    fields: [report.roomId],
    references: [room.id],
  }),
  user: one(user, {
    fields: [report.userId],
    references: [user.id],
  }),
}));

export const userRoomRelations = relations(userRoom, ({ one }) => ({
  user: one(user, {
    fields: [userRoom.userId],
    references: [user.id],
  }),
  room: one(room, {
    fields: [userRoom.roomId],
    references: [room.id],
  }),
}));
