## Advanced Examples

### 1) Grouping results by parent (Epics/Subtasks)

```
# See epics with their child stories/tasks in a tree
bjira query -g "project = \"FOO\" ORDER BY updated DESC"
```

### 2) Parameterized presets for quick search

```
bjira preset create text-search "project = \"FOO\" AND text ~ \"$$$\" ORDER BY created DESC"
bjira run text-search -q "payment gateway timeout"
```

### 3) Managing custom fields

```
# Discover fields for a project and type
bjira field listall

# Track a field so it appears in show and is editable
bjira field add FOO Story "Story Points"

# Set it on an issue
bjira set custom 'Story Points' FOO-123
```

### 4) Linking work to Epics during creation

In `bjira create`, answer "yes" to set a parent epic, then pick an epic from the same project or search-as-you-type.

### 5) Sprints overview for your issues

```
# Select board and active/future sprint, then see your issues by status
bjira sprint show

# Show all users
bjira sprint show --all
```

### 6) Quick actions

```
# Assign to yourself
bjira set assignee --me FOO-123

# Open in browser
bjira open FOO-123
```

