## query

Run an ad-hoc JQL query.

Usage:

```
bjira query [options] <JQL>
```

Options:
- `-l, --limit <N>`: maximum number of issues to fetch (default 20; pagination continues until limit or last page).
- `-g, --grouped`: group results by parent (Epic or Parent) and render a tree.

Examples:

```
# My open issues in project FOO
bjira query "project = \"FOO\" AND statusCategory != Done AND assignee = currentUser()"

# Group by parent
bjira query -g "project = \"FOO\" ORDER BY updated DESC"
```

