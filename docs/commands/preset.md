## preset

Manage named JQL presets.

Subcommands:

- `preset create <NAME> <QUERY>`: create a new preset. Use `$$$` to mark positional parameters.
- `preset remove <NAME>`: delete a preset.
- `preset list`: list presets with their JQL.

Examples:

```
# Save a reusable search for your work
bjira preset create mine "project = \"FOO\" AND statusCategory != Done AND assignee = currentUser()"

# Parameterized search (one placeholder)
bjira preset create search "project = \"FOO\" AND text ~ \"$$$\" ORDER BY created DESC"
```

Run presets using the `run` command.

