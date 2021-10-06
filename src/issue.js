import color from 'chalk';
import Table from 'cli-table3';

import Command from './command.js';
import Jira from './jira.js';

const DEFAULT_QUERY_LIMIT = 20;

class Issue extends Command {
  addOptions(program) {
    const cmd = program.command('issue')
                       .description('Show an issue')
                       .argument('<id>', 'The issue ID')
                       .action(async id => {
      const jira = new Jira(program);

      const resultFields = await jira.spin('Retrieving the fields...',
                                           jira.api.listFields());
      const result = await jira.spin('Running query...',
                                     jira.api.findIssue(id));

      const issue = Issue.replaceFields(result, resultFields);

      const table = new Table({ chars: jira.tableChars });

      table.push(
        { 'Summary': issue.fields['Summary'].trim() },
        { 'Status': color.green(issue.fields['Status'].name) },
        { 'Type': issue.fields['Issue Type'].name },
        { 'Project': issue.fields['Project'].name + ' (' + issue.fields['Project'].key + ')' },
        { 'Reporter': issue.fields['Reporter'].emailAddress },
        { 'Assignee': issue.fields['Assignee'].emailAddress ? issue.fields['Assignee'].emailAddress : '(null)'},
        { 'Priority': issue.fields['Priority'].name },
        { 'Epic Link': color.blue(issue.fields['Epic Link']) },
        { '': '' },
        { 'Created on': issue.fields['Created'] },
        { 'Updated on': issue.fields['Updated'] }
      );

      console.log( table.toString() );
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
};

export default Issue;
