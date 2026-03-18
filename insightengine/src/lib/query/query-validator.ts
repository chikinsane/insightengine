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
 * Validates that any double-quoted identifiers in the SQL actually exist in the schema.
 *
 * Strategy: our NL-to-SQL prompt instructs Claude to ALWAYS double-quote every column
 * reference (e.g. "Basic Salary (₹)", "State"). Bare words are therefore always
 * SQL functions, keywords, or user-defined aliases — never raw column names — so we
 * only need to validate the quoted subset. This avoids false positives on computed
 * aliases like `employee_count` or `percentage`.
 */
export function validateColumnReferences(
  sql: string,
  validColumns: string[]
): ValidationResult {
  const validSet = new Set(validColumns.map((c) => c.toLowerCase()))

  // Extract every "double-quoted" identifier from the SQL
  const quotedPattern = /"([^"]+)"/g
  const unknownQuoted: string[] = []
  let match: RegExpExecArray | null

  while ((match = quotedPattern.exec(sql)) !== null) {
    const identifier = match[1]
    if (!validSet.has(identifier.toLowerCase())) {
      unknownQuoted.push(identifier)
    }
  }

  if (unknownQuoted.length > 0) {
    return {
      valid: false,
      reason: `Unknown columns: ${unknownQuoted.join(', ')}. Valid columns are: ${validColumns.join(', ')}.`,
    }
  }

  return { valid: true }
}
