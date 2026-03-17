import { pgTable, text, timestamp, uuid, boolean, jsonb, integer } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const dataSources = pgTable('data_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  encryptedCredential: text('encrypted_credential'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const datasets = pgTable('datasets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dataSourceId: uuid('data_source_id').notNull().references(() => dataSources.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  schema: jsonb('schema'),
  rowCount: integer('row_count'),
  storageKey: text('storage_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const dashboards = pgTable('dashboards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  shareToken: text('share_token').unique(),
  isShared: boolean('is_shared').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const queries = pgTable('queries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  datasetId: uuid('dataset_id').notNull().references(() => datasets.id, { onDelete: 'cascade' }),
  naturalLanguage: text('natural_language').notNull(),
  generatedSql: text('generated_sql'),
  vizType: text('viz_type'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const resultsCache = pgTable('results_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  queryId: uuid('query_id').notNull().references(() => queries.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  resultJson: jsonb('result_json').notNull(),
  cachedAt: timestamp('cached_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
})
