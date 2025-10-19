## create

Create a new issue via interactive prompts.

Usage:

```
bjira create
```

Flow:
- Pick a project.
- Pick an issue type.
- Enter summary and optionally description (opens `$EDITOR`).
- Provide required custom fields (if any).
- Optionally set parent Epic (search-as-you-type, defaults to epics in project).
- After creation, optionally assign, set status, set configured custom fields, and add to a sprint.

Notes:
- Custom field prompts are limited to supported types (string, number, select/multiselect via `allowedValues`).
- Use `field add` to make custom fields visible and manageable in `show`/`set`.

