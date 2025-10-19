## issue (show)

Display details for a single issue.

Usage:

```
bjira show [options] <ISSUE-ID>
```

Options:
- `-a, --attachments`: include attachments details.
- `-C, --comments`: include comments.
- `-s, --subissues`: list sub-issues; for Epics, also lists child issues.

The output includes key metadata, custom fields you have added via `field add`, timestamps, and counts for attachments and comments.

