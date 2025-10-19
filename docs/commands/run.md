## run

Run a saved preset.

Usage:

```
bjira run [options] <NAME>
```

Options:
- `-q, --query <arg...>`: supply positional arguments for `$$$` placeholders in the preset JQL. Repeat for multiple placeholders in order.
- `-l, --limit <N>`: maximum number of issues to fetch (default 20).
- `-g, --grouped`: group by parent and render a tree.

Examples:

```
bjira run mine
bjira run search -q "login bug"
```

