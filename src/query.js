import color from 'chalk';
import Table from 'cli-table3';

import Command from './command.js';
import ErrorHandler from './errorhandler.js';
import Field from './field.js';
import Jira from './jira.js';

const DEFAULT_QUERY_LIMIT = 20;

class Query extends Command {
  addOptions(program) {
    const cmd = program.command('query')
      .description('Run a query')
      .argument('<query>', 'The query')
      .option('-l, --limit <limit>',
        `Set the query limit. Default ${DEFAULT_QUERY_LIMIT}`,
        DEFAULT_QUERY_LIMIT)
      .action(async query => {
        const jira = new Jira(program);
        const opts = cmd.opts();

        let resultFields;
        try {
          resultFields = await Field.listFields(jira);
        } catch (e) {
          ErrorHandler.showError(jira, e);
          return;
        }

        let expectedResult = opts.limit;
        let issues = [];

        while (issues.length < opts.limit) {
          let result;
          try {
            result = await jira.spin('Running query...',
              jira.api.searchJira(query, {
                startAt: issues.lengh,
                maxResults: opts.limit - issues.length
              }));
          } catch (e) {
            ErrorHandler.showError(jira, e);
            return;
          }

          if (result.warningMessages) {
            ErrorHandler.showWarningMessages(result.warningMessages);
            return;
          }

          issues = issues.concat(result.issues);
          if (issues.length >= result.total) break;
        }

        Query.showIssues(jira, issues, resultFields);
      });
  }

  static showIssues(jira, issues, fields) {
    const table = new Table({
      chars: jira.tableChars,
      head: ['Key', 'Status', 'Type', 'Summary']
    });

    issues.forEach(issue => table.push([color.blue(issue.key),
      color.green(issue.fields.status.name),
      color.green(issue.fields.issuetype.name),
      issue.fields.summary
    ]))
    console.log(table.toString());
  }
};

export default Query;