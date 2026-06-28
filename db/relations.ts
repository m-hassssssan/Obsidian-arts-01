import { relations } from "drizzle-orm";
import { users, commissions, commissionEvents, messages } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  commissions: many(commissions),
  messages: many(messages),
}));

export const commissionsRelations = relations(commissions, ({ one, many }) => ({
  user: one(users, { fields: [commissions.userId], references: [users.id] }),
  events: many(commissionEvents),
  messages: many(messages),
}));

export const commissionEventsRelations = relations(commissionEvents, ({ one }) => ({
  commission: one(commissions, {
    fields: [commissionEvents.commissionId],
    references: [commissions.id],
  }),
  createdBy: one(users, {
    fields: [commissionEvents.createdBy],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  commission: one(commissions, {
    fields: [messages.commissionId],
    references: [commissions.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));
