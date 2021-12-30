# Jira cli

This is a simple Jira CLI tool. License: MIT

## How to install it

```
$ npm install -g bjira
```

## How to configure it

Run `bjira init` to set up the tool. You can optain the API token from your
jira settings.

```
$ bjira init
? Provide your jira host: your-domain.atlassian.net
? Please provide your jira username: username
? API token: [hidden]
? Enable HTTPS Protocol? Yes
Config file succesfully created in: /home/<username>/.bjira.json
```

## How to use it

Run `bjira help` to see the main help menu. Each command is well documented.

There are 2 main concepts to know:
- presets
- custom fields.

### Presets

Let's say you want to retrieve all the open issues assigned to you for project
FOO.  The query is something like this:

```
bjira query 'project = "FOO" AND status != "Done" AND status != "Cancelled" AND assignee = currentUser()'
```

You can save this query as a preset:
```
bjira create mine 'project = "FOO" AND status != "Done" AND status != "Cancelled" AND assignee = currentUser()'
```

Then, you can run it using its query name:
```
bjira run mine
```

If you want to have parameters in your query, use `$$$` as placeholder. For instance:
```
bjira preset create search 'project = "FOO" AND text ~ "$$$" ORDER BY created DESC'
bjira run search -q "hello world"
```


### Custom fields
Jira is strongly configurable via custom fields. You can retrieve the list of custom fields using:

```
bjira field listall
```

If you want to see some of them in the issue report, add them for the project (FOO) and the issue type (Story):

```
bjira field add FOO Story "Story Points"
```

Any custom fields added to the list will be shown in the issue report (See `bjira show`).
You can also set custom fields using `bira set custom `Story Points' ISSUE-ID`.
