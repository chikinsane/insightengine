import type { ValidationResult } from '@/types/query'

/**
 * Matches forbidden DML/DDL/DCL keywords at word boundaries (case-insensitive).
 * Two-layer security: first reject known dangerous keywords, then require SELECT.
 */
const FORBIDDEN_DML = /\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE)\b/i

/**
 * Matches valid SELECT-only queries (plain SELECT or WITH...SELECT CTEs).
 */
const REQUIRE_SELECT = /^\s*(WITH\s+[\s\S]+?\s+)?SELECT\s/i

/**
 * Validates a SQL query string, rejecting DML/DDL/DCL statements.
 * Only allows SELECT and WITH...SELECT (CTE) statements.
 */
export function validateSQL(query: string): ValidationResult {
  if (!query || !query.trim()) {
    return { valid: false, reason: 'Query must be a SELECT statement.' }
  }

  if (FORBIDDEN_DML.test(query)) {
    return {
      valid: false,
      reason: 'Query contains a disallowed statement. Only SELECT queries are permitted.',
    }
  }

  if (!REQUIRE_SELECT.test(query)) {
    return {
      valid: false,
      reason: 'Query must be a SELECT statement.',
    }
  }

  return { valid: true }
}

/**
 * Extracts column-like identifiers from SQL and checks each against the valid columns list.
 * This is a best-effort check — it catches obvious hallucinated columns.
 */
export function validateColumnReferences(
  sql: string,
  validColumns: string[]
): ValidationResult {
  // Extract identifiers: bare words and backtick/double-quote quoted names
  // We skip SQL keywords and table aliases
  const SQL_KEYWORDS = new Set([
    'select', 'from', 'where', 'and', 'or', 'not', 'in', 'like', 'between',
    'order', 'by', 'group', 'having', 'limit', 'offset', 'join', 'left', 'right',
    'inner', 'outer', 'full', 'cross', 'on', 'as', 'distinct', 'count', 'sum',
    'avg', 'min', 'max', 'case', 'when', 'then', 'else', 'end', 'null', 'is',
    'true', 'false', 'with', 'union', 'all', 'except', 'intersect', 'data',
    'cte', 'asc', 'desc', 'coalesce', 'cast', 'over', 'partition', 'row_number',
    'rank', 'dense_rank', 'lag', 'lead', 'ntile', 'percent_rank', 'cume_dist',
  ])

  const validSet = new Set(validColumns.map((c) => c.toLowerCase()))

  // Extract bare identifiers (word characters only, not starting with digit)
  const identifierPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g
  const candidates = new Set<string>()
  let match: RegExpExecArray | null

  while ((match = identifierPattern.exec(sql)) !== null) {
    const token = match[1].toLowerCase()
    if (!SQL_KEYWORDS.has(token)) {
      candidates.add(token)
    }
  }

  const unknownColumns = [...candidates].filter((c) => !validSet.has(c))

  if (unknownColumns.length > 0) {
    return {
      valid: false,
      reason: `Unknown columns: ${unknownColumns.join(', ')}. Valid columns are: ${validColumns.join(', ')}.`,
    }
  }

  return { valid: true }
}
