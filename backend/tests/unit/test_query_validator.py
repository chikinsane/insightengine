import pytest
from app.security.query_validator import validate_query, ValidationResult


class TestSelectPasses:
    def test_simple_select(self):
        result = validate_query("SELECT * FROM users")
        assert result.valid is True

    def test_select_with_where(self):
        result = validate_query("SELECT name FROM users WHERE id = 1")
        assert result.valid is True

    def test_select_with_join(self):
        result = validate_query(
            "SELECT u.name, d.name FROM users u JOIN datasets d ON u.id = d.user_id"
        )
        assert result.valid is True

    def test_select_with_subquery(self):
        result = validate_query("SELECT * FROM (SELECT id FROM users) sub")
        assert result.valid is True

    def test_select_with_aggregation(self):
        result = validate_query("SELECT COUNT(*), AVG(salary) FROM employees GROUP BY dept")
        assert result.valid is True

    def test_select_with_cte(self):
        result = validate_query("WITH active AS (SELECT * FROM users WHERE active = true) SELECT * FROM active")
        assert result.valid is True


class TestDMLRejected:
    def test_insert_rejected(self):
        result = validate_query("INSERT INTO users (name) VALUES ('x')")
        assert result.valid is False
        assert "INSERT" in result.reason.upper() or "not permitted" in result.reason.lower() or "SELECT" in result.reason

    def test_update_rejected(self):
        result = validate_query("UPDATE users SET name = 'x'")
        assert result.valid is False

    def test_delete_rejected(self):
        result = validate_query("DELETE FROM users WHERE id = 1")
        assert result.valid is False

    def test_drop_rejected(self):
        result = validate_query("DROP TABLE users")
        assert result.valid is False

    def test_alter_rejected(self):
        result = validate_query("ALTER TABLE users ADD COLUMN x TEXT")
        assert result.valid is False

    def test_create_rejected(self):
        result = validate_query("CREATE TABLE evil (id INT)")
        assert result.valid is False

    def test_truncate_rejected(self):
        result = validate_query("TRUNCATE users")
        assert result.valid is False


class TestNestedDMLRejected:
    def test_cte_with_dml(self):
        # CTE containing INSERT — must be caught by AST walker
        sql = "WITH x AS (INSERT INTO foo VALUES (1) RETURNING *) SELECT * FROM x"
        result = validate_query(sql)
        assert result.valid is False


class TestMultiStatement:
    def test_multi_statement_rejected(self):
        result = validate_query("SELECT 1; DROP TABLE users")
        assert result.valid is False
        assert "multi-statement" in result.reason.lower() or "2" in result.reason


class TestParseError:
    def test_invalid_sql_handled(self):
        result = validate_query("NOT VALID SQL !!!")
        assert result.valid is False
        # Should not raise — returns ValidationResult with reason


class TestValidationResultStructure:
    def test_valid_result_has_empty_reason(self):
        result = validate_query("SELECT 1")
        assert result.valid is True
        assert result.reason == ""

    def test_invalid_result_has_reason(self):
        result = validate_query("DELETE FROM users")
        assert result.valid is False
        assert len(result.reason) > 0
