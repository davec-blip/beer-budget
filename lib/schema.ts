import { pgTable, uuid, text, numeric, timestamp, integer, date, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  username: text('username').unique().notNull(),
  password_hash: text('password_hash').notNull(),
  timezone: text('timezone').notNull().default('America/New_York'),
  accrual_rate: numeric('accrual_rate', { precision: 5, scale: 2 }).notNull().default('1.00'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const drink_logs = pgTable(
  'drink_logs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    log_date: date('log_date').notNull(),
    drink_count: integer('drink_count').notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: unique().on(t.user_id, t.log_date),
  })
)

export const budget_resets = pgTable('budget_resets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  reset_at: timestamp('reset_at', { withTimezone: true }).notNull(),
})

export type User = typeof users.$inferSelect
export type DrinkLog = typeof drink_logs.$inferSelect
export type BudgetReset = typeof budget_resets.$inferSelect
