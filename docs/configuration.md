## Configuration

Run the interactive setup to create your config file:

```
bjira init
```

You will be prompted for Jira host, username, and API token. By default the configuration is stored in `~/.bjira.json`. You can change the location using the global `-c, --config <file>` option in any command.

Example config file:

```json
{
  "jira": {
    "host": "your-domain.atlassian.net",
    "protocol": "https",
    "username": "you@example.com",
    "password": "<api token>",
    "apiVersion": 3,
    "strictSSL": true
  },
  "presets": {
    "mine": "project = \"FOO\" AND statusCategory != Done AND assignee = currentUser()",
    "search": "project = \"FOO\" AND text ~ \"$$$\" ORDER BY created DESC"
  },
  "fields": [
    { "projectName": "FOO", "issueTypeName": "Story", "fieldName": "Story Points" }
  ],
  "latestProject": "FOO"
}
```

Notes:
- `presets` hold reusable JQL, with `$$$` placeholders for positional parameters.
- `fields` config controls which custom fields are shown in `show` output and usable via `set custom`.
- `latestProject` is managed automatically to prioritize project picks.

