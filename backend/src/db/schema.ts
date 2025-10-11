import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['painter', 'customer']);

// Enum for booking status
export const bookingStatusEnum = pgEnum('booking_status', [
  'confirmed',
  'completed',
  'cancelled',
]);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Availability table
export const availability = pgTable('availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  painterId: uuid('painter_id')
    .notNull()
    .references(() => users.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Bookings table
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => users.id),
  painterId: uuid('painter_id')
    .notNull()
    .references(() => users.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: bookingStatusEnum('status').notNull().default('confirmed'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  availability: many(availability),
  bookingsAsCustomer: many(bookings, { relationName: 'customerBookings' }),
  bookingsAsPainter: many(bookings, { relationName: 'painterBookings' }),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  painter: one(users, {
    fields: [availability.painterId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
    relationName: 'customerBookings',
  }),
  painter: one(users, {
    fields: [bookings.painterId],
    references: [users.id],
    relationName: 'painterBookings',
  }),
}));
