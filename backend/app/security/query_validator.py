import sqlglot
import sqlglot.expressions as exp
from dataclasses import dataclass

FORBIDDEN_NODE_TYPES = (
    exp.Insert, exp.Update, exp.Delete, exp.Drop,
    exp.Create, exp.Alter,
)

# Check if exp.Truncate exists (varies across sqlglot versions)
if hasattr(exp, 'Truncate'):
    FORBIDDEN_NODE_TYPES = FORBIDDEN_NODE_TYPES + (exp.Truncate,)


@dataclass
class ValidationResult:
    valid: bool
    reason: str = ""


def validate_query(sql: str) -> ValidationResult:
    """
    Returns ValidationResult(valid=True) only if sql is a pure SELECT statement.
    Rejects DDL, DML, and multi-statement inputs.
    """
    try:
        statements = sqlglot.parse(sql)
    except sqlglot.errors.ParseError as e:
        return ValidationResult(valid=False, reason=f"SQL parse error: {e}")

    # Filter out None/empty statements (trailing semicolons)
    statements = [s for s in statements if s is not None]

    if len(statements) != 1:
        return ValidationResult(
            valid=False,
            reason=f"Multi-statement queries are not allowed (got {len(statements)} statements)"
        )

    statement = statements[0]

    # Must be a SELECT at the top level
    if not isinstance(statement, exp.Select):
        return ValidationResult(
            valid=False,
            reason=f"Only SELECT statements are permitted; got {type(statement).__name__}"
        )

    # Walk the full AST — reject if any DML/DDL node appears anywhere
    for node in statement.walk():
        if isinstance(node, FORBIDDEN_NODE_TYPES):
            return ValidationResult(
                valid=False,
                reason=f"Query contains forbidden operation: {type(node).__name__}"
            )

    return ValidationResult(valid=True)
