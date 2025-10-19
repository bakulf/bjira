## sprint

Work with Agile sprints (boards).

Subcommands:

- `sprint add <ISSUE-ID>`: add the issue to an active or future sprint (you pick board and sprint if multiple).
- `sprint remove <ISSUE-ID>`: move the issue back to the backlog.
- `sprint show [-a|--all]`: show sprint issues grouped by assignee and status columns. By default only your issues are shown; with `--all` show all users.

Notes:
- This uses Jira Agile (board/sprint) APIs; ensure your user has permissions.

