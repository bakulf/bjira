// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import Command from './command.js';
import ErrorHandler from './errorhandler.js';
import Field from './field.js';
import Issue from './issue.js';
import Jira from './jira.js';
import Table from './table.js';

import color from 'chalk';

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
        const result = await Query.runQuery(jira, query, opts.limit);

        Query.showIssues(jira, result.issues, result.total, resultFields);
      });
  }

  static showIssues(jira, issues, total, fields) {
    console.log(`Showing ${color.bold(issues.length)} issues of ${color.bold(total)}`);

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

  static async runQuery(jira, query, expectedResult) {
    let issues = [];
    let total = 0;
    while (issues.length < (expectedResult === undefined ? issues.length + 1 : expectedResult)) {
      const result = await jira.spin('Running query...',
        jira.api.searchJira(query, {
          startAt: issues.length,
          maxResults: expectedResult - issues.length
        }));

      if (result.warningMessages) {
        ErrorHandler.showWarningMessages(result.warningMessages);
        return;
      }

      total = result.total;
      issues = issues.concat(result.issues);

      if (issues.length >= total) break;
    }

    return {
      total,
      issues
    };
  }
};

export default Query;