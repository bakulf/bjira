import Command from './command.js';
import ErrorHandler from './errorhandler.js';
import Field from './field.js';
import Issue from './issue.js';
import Jira from './jira.js';
import Table from './table.js';

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

        const resultFields = await Field.listFields(jira);

        let expectedResult = opts.limit;
        let issues = [];

        while (issues.length < opts.limit) {
          const result = await jira.spin('Running query...',
            jira.api.searchJira(query, {
              startAt: issues.lengh,
              maxResults: opts.limit - issues.length
            }));

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
      head: ['Key', 'Status', 'Type', 'Assignee', 'Summary']
    });

    issues.forEach(issue => table.addRow([{
        color: "blue",
        text: issue.key
      }, {
        color: "green",
        text: issue.fields.status.name
      }, {
        color: "green",
        text: issue.fields.issuetype.name
      }, {
        color: "yellow",
        text: Issue.showUser(issue.fields.assignee)
      },
      issue.fields.summary
    ]))

    console.log(table.toString());
  }
};

export default Query;