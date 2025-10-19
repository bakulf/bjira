## field

Manage custom fields visibility and discovery.

Subcommands:

- `field listall`: show all projects, issue types, and available fields, marking supported ones.
- `field add <PROJECT> <ISSUE-TYPE> <FIELD-NAME>`: track a field so it appears in `show` and can be set with `set custom`.
- `field remove <PROJECT> <ISSUE-TYPE> <FIELD-NAME>`: stop tracking the field.
- `field list`: list tracked fields from your config.

Notes:
- Supported field types: `string`, `number`, and select-like fields exposing `allowedValues`.

