## set

Update fields and transitions of issues.

Subcommands:

- `set assignee [--me] <ISSUE-ID>`: assign to a user. With `--me`, assign to the current user without a prompt.
- `set unassign <ISSUE-ID>`: clear the assignee.
- `set status <ISSUE-ID>`: change status via available transitions; required transition fields are prompted if supported.
- `set custom <FIELD-NAME> <ISSUE-ID>`: set a tracked custom field (see `field add`).

Notes:
- Supported field types for `set custom`: string, number, select/multi-select fields exposing `allowedValues`.

