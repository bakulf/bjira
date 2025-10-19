## attachment

Work with attachments.

Subcommands:

- `attachment get <ISSUE-ID> <ATTACHMENT-ID>`: download the attachment to stdout.

Examples:

```
# List attachments via show, then download by id
bjira show -a ISSUE-123 | less
bjira attachment get ISSUE-123 10001 > file.bin
```

Notes:
- Upload and delete are not implemented yet.

