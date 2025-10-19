## Concepts

### Presets

Presets are named JQL queries saved in your config file and executed via `bjira run`.

- Use `$$$` as a positional placeholder; supply values with `-q` in the same order.

Examples:

```
bjira preset create mine "project = \"FOO\" AND statusCategory != Done AND assignee = currentUser()"
bjira preset create search "project = \"FOO\" AND text ~ \"$$$\" ORDER BY created DESC"
bjira run mine
bjira run search -q "security vulnerability"
```

### Custom Fields

Jira projects often define custom fields (e.g., Story Points). To surface and manage them in bjira:

1. Discover supported fields using `bjira field listall`.
2. Add fields to your config using `bjira field add <PROJECT> <ISSUE-TYPE> <FIELD-NAME>`.
3. View these fields in `bjira show <ISSUE-ID>`.
4. Update them using `bjira set custom '<FIELD-NAME>' <ISSUE-ID>`.

Supported field types:
- `string`, `number`, and select/multi-select fields exposing `allowedValues`.

