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
      .option('-g, --grouped', 'Group the issues by parenting')
      .action(async query => {
        const jira = new Jira(program);
        const opts = cmd.opts();

        const resultFields = await Field.listFields(jira);
        const result = await Query.runQuery(jira, query, opts.limit);

        await Query.showIssues(jira, result.issues, result.total, resultFields, opts.grouped);
      });
  }

  static async showIssues(jira, issues, total, fields, grouped) {
    console.log(`Showing ${color.bold(issues.length)} issues of ${color.bold(total)}`);

    issues = issues.map(issue => Issue.replaceFields(issue, fields)).map(issue => ({
      children: [],
      issue
    }));

    const addIssueInTree = (issues, issue, parentId) => {
      for (const existingIssue of issues) {
        if (existingIssue.issue.key == parentId) {
          existingIssue.children.push(issue);
          return true;
        }

        if (addIssueInTree(existingIssue.children, issue, parentId)) {
          return true;
        }
      }

      return false;
    };

    const computeIssueInTree = async (issues, newIssues, issue) => {
      // Top level.
      if (!issue.issue.fields['Epic Link'] && !issue.issue.fields['Parent']) {
        newIssues.push(issue);
        return;
      }

      const parentId = issue.issue.fields['Epic Link'] || issue.issue.fields['Parent'].key;

      // In the already processed issues
      if (addIssueInTree(newIssues, issue, parentId)) {
        return;
      }

      // In the non-already processed issues
      if (addIssueInTree(issues, issue, parentId)) {
        return;
      }

      const parentIssueResult = await jira.spin('Running query...', jira.api.findIssue(parentId));
      const parentIssue = Issue.replaceFields(parentIssueResult, fields);

      const parentIssueData = {
        children: [issue],
        incompleted: true,
        issue: parentIssue
      };

      await computeIssueInTree(issues, newIssues, parentIssueData);

      // In the already processed issues
      if (addIssueInTree(newIssues, issue, parentId)) {
        return;
      }

      // In the non-already processed issues
      if (addIssueInTree(issues, issue, parentId)) {
        return;
      }

      newIssues.push(issue);
    };

    if (grouped) {
      const newIssues = [];
      for (; issues.length; issues = issues.splice(1)) {
        await computeIssueInTree(issues, newIssues, issues[0]);
      }
      issues = newIssues;
    }

    const table = new Table({
      head: ['Key', 'Status', 'Type', 'Assignee', 'Summary'],
      unresizableColumns: [0],
    });

    const showIssue = (table, issue, nested) => {
      let pre = "";
      if (nested.length) {
        pre += " ";
        for (let i = 0; i < nested.length - 1; ++i) {
          pre += (nested[i]) ? '│   ' : '    ';
        }
        pre += (nested[nested.length - 1]) ? "├─ " : "└─ ";
      }

      table.addRow([{
        color: "blue",
        style: issue.incompleted ? "italic" : "normal",
        text: pre + issue.issue.key
      }, {
        color: "green",
        style: issue.incompleted ? "italic" : "normal",
        text: issue.issue.fields['Status'].name
      }, {
        color: "green",
        style: issue.incompleted ? "italic" : "normal",
        text: issue.issue.fields['Issue Type'].name
      }, {
        color: "yellow",
        style: issue.incompleted ? "italic" : "normal",
        text: Issue.showUser(issue.issue.fields['Assignee'])
      }, {
        style: issue.incompleted ? "italic" : "normal",
        text: issue.issue.fields['Summary']
      }]);

      if (issue.children.length) {
        const newNested = [];
        nested.forEach(n => newNested.push(n));
        newNested.push(false);
        issue.children.forEach((subissue, pos) => {
          newNested[nested.length] = (pos < issue.children.length - 1);
          showIssue(table, subissue, newNested);
        });
      }
    };

    issues.forEach(issue => showIssue(table, issue, []));

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