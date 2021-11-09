import color from 'chalk';
import Table from 'cli-table3';

import Command from './command.js';
import ErrorHandler from './errorhandler.js'
import Field from './field.js';
import Jira from './jira.js';

const DEFAULT_QUERY_LIMIT = 20;

class Issue extends Command {
  static url(jira, id) {
    return `${jira.config.jira.protocol}://${jira.config.jira.host}/browse/${id}`;
  }

  addOptions(program) {
    const cmd = program.command('issue')
      .description('Show an issue')
      .option('-C, --comments')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);

        let resultFields;
        try {
          resultFields = await Field.listFields(jira);
        } catch (e) {
          ErrorHandler.showError(jira, e);
          return;
        }

        let result;
        try {
          result = await jira.spin('Running query...', jira.api.findIssue(id));
        } catch (e) {
          ErrorHandler.showError(jira, e);
          return;
        }

        const issue = Issue.replaceFields(result, resultFields);

        let epicIssue = null;
        if (issue.fields['Epic Link']) {
          const epicResult = await jira.spin('Fetching the epic issue...',
            jira.api.findIssue(issue.fields['Epic Link']));
          epicIssue = Issue.replaceFields(epicResult, resultFields);
        }

        const table = new Table({
          chars: jira.tableChars
        });

        table.push({
          'Summary': issue.fields['Summary'].trim()
        }, {
          'URL:': color.blue(Issue.url(jira, id))
        }, {
          'Status': color.green(issue.fields['Status'].name)
        }, {
          'Type': issue.fields['Issue Type'].name
        }, {
          'Project': issue.fields['Project'].name + ' (' + issue.fields['Project'].key + ')'
        }, {
          'Reporter': Issue.showUser(issue.fields['Reporter'])
        }, {
          'Assignee': Issue.showUser(issue.fields['Assignee'])
        }, {
          'Priority': issue.fields['Priority'].name
        }, {
          'Epic Link': this.showEpicIssue(epicIssue)
        }, {
          'Labels': issue.fields['Labels'].join(', ')
        }, {
          'Sprint': issue.fields['Sprint']?.map(sprint => this.showSprint(sprint)).join(', ')
        }, );

        jira.fields.forEach(fieldName => {
          const data = {};
          data[fieldName] = issue.fields[fieldName] || "unset"
          table.push(data);
        });

        table.push({
          '': ''
        }, {
          'Created on': issue.fields['Created']
        }, {
          'Updated on': issue.fields['Updated']
        }, {
          '': ''
        }, {
          'Description': issue.fields['Description']
        }, {
          '': ''
        }, {
          'Comments': issue.fields['Comment'].total
        }, );

        if (cmd.opts().comments) {
          issue.fields['Comment'].comments.forEach(comment => {
            table.push({
              '': ''
            }, {
              'Comment': color.yellow(comment.id)
            }, {
              'Author': Issue.showUser(comment.author)
            }, {
              'Created on': comment['Created']
            }, {
              'Updated on': comment['Updated']
            }, {
              'Body': comment.body
            }, );
          });
        }

        console.log(table.toString());
      });
  }

  static replaceFields(obj, fields) {
    if (Array.isArray(obj)) {
      obj.forEach((o, pos) => {
        obj[o] = Issue.replaceFields(o, fields);
      });
    } else if (obj && typeof obj === "object") {
      Object.keys(obj).forEach(key => {
        if (obj[key] === null) {
          delete obj[key];
          return;
        }

        obj[key] = Issue.replaceFields(obj[key], fields);

        const field = fields.find(f => f.key == key);
        if (field) {
          obj[field.name] = obj[key];
          delete obj[key];
        }
      });
    }

    return obj;
  }

  static showUser(user) {
    if (!user) return "(null)";
    let str = user.displayName;
    if (user.emailAddress) str += ` (${color.yellow(user.emailAddress)})`;
    return str;
  }

  showEpicIssue(issue) {
    if (!issue) return "";
    return `${color.blue(issue.key)} (${color.yellow(issue.fields['Summary'].trim())})`;
  }

  showSprint(sprint) {
    return `${color.blue(sprint.name)} (${color.yellow(sprint.state)})`;
  }
};

export default Issue;