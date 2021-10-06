import color from 'chalk';
import Table from 'cli-table3';

import Command from './command.js';
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
        } catch(e) {
          const table = new Table({
            chars: jira.tableChars,
            head: ['Errors']
          });

          e.error.errorMessages.forEach(error => table.push([color.blue(error)]));
          console.log(table.toString());
          return;
        }

        if (result.warningMessages) {
          const table = new Table({
            chars: jira.tableChars,
            head: ['Warnings']
          });

          result.warningMessages.forEach(warning => table.push([color.blue(warning)]));
          console.log(table.toString());
          return;
        }

        issues = issues.concat(result.issues);
        if (issues.length >= result.total) break;
      }

      const table = new Table({
        chars: jira.tableChars,
        head: ['Key', 'Status', 'Summary']
      });

      issues.forEach(issue => table.push([color.blue(issue.key),
                                          color.green(issue.fields.status.name),
                                          issue.fields.summary]))
      console.log(table.toString());
    });
  }
};

export default Query;
