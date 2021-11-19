// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import color from 'chalk';

import Ask from './ask.js';
import Command from './command.js';
import Field from './field.js';
import Issue from './issue.js';
import Jira from './jira.js';
import Project from './project.js';
import Table from './table.js';
import User from './user.js';

class Sprint extends Command {
  addOptions(program) {
    const sprintCmd = program.command('sprint')
      .description('Play with sprints');
    sprintCmd.command('add')
      .description('Add an issue to a sprint')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);
        await Sprint.add(jira, id);
      });

    sprintCmd.command('remove')
      .description('Remove an issue from a sprint')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);

        await jira.spin('Adding the issue to the sprint...',
          jira.apiAgileRequest("/backlog/issue", {
            method: 'POST',
            followAllRedirects: true,
            body: {
              issues: [id]
            }
          }));
      });

    sprintCmd.command('show')
      .description('Show the sprint')
      .action(async () => {
        const jira = new Jira(program);
        const data = await Sprint.pickSprint(jira);
        if (data === null) {
          console.log("No active sprints");
          return;
        }

        const resultFields = await Field.listFields(jira);

        let issues = [];
        while (true) {
          const results = await jira.spin('Retrieving issues...', jira.api.getBoardIssuesForSprint(data.boardId, data.sprintId, issues.length));
          issues = issues.concat(results.issues);
          if (issues.length >= results.total) break;
        }

        if (issues.length === 0) {
          console.log("No issues");
          return;
        }

        const statuses = [];

        const users = [];
        issues.forEach(issue => {
          issue = Issue.replaceFields(issue, resultFields);

          const accountId = issue.fields['Assignee'] ? issue.fields['Assignee'].accountId : null;
          let user = users.find(user => user.accountId === accountId);
          if (!user) {
            user = {
              accountId,
              displayName: issue.fields['Assignee']?.displayName,
              user: issue.fields['Assignee'],
              statuses: []
            };
            users.push(user);
          }

          if (!statuses.includes(issue.fields['Status'].name)) {
            statuses.push(issue.fields['Status'].name);
          }

          let status = user.statuses.find(status => issue.fields['Status'].name === status.name);
          if (!status) {
            status = {
              name: issue.fields['Status'].name,
              issues: []
            };
            user.statuses.push(status);
          }

          status.issues.push(issue);
        });

        const currentUser = await jira.spin('Retrieving current user...', jira.api.getCurrentUser());
        const transitionList = await jira.spin('Retrieving transitions...', jira.api.listTransitions(issues[0].id));

        User.sortUsers(currentUser, users).forEach(user => {
          console.log(color.yellow(Issue.showUser(user.user)));

          const maxIssues = Math.max(...user.statuses.map(status => status.issues.length));

          const statuses = user.statuses.sort((a, b) => {
            const posA = transitionList.transitions.findIndex(transition => transition.name === a.name);
            const posB = transitionList.transitions.findIndex(transition => transition.name === b.name);
            return posA - posB;
          });

          const table = new Table({
            head: statuses.map(status => status.name),
          });

          for (let i = 0; i < maxIssues; ++i) {
            const line = statuses.map(status => {
              if (status.issues.length > i) {
                return `${status.issues[i].key} ${status.issues[i].fields['Summary'].trim()}`
              }
              return ""
            });
            table.addRow(line);
          }

          console.log(table.toString() + '\n');
        });

      });
  }

  static async pickSprint(jira) {
    const project = await Project.pickProject(jira);
    const boardList = await jira.spin('Retrieving boards...',
      jira.api.getAllBoards(undefined, undefined, undefined, undefined,
        project.key));

    const boardPos = await Ask.askList('Board:', boardList.values.map(board => board.name));

    const sprintList = await jira.spin('Retrieving sprints...',
      jira.api.getAllSprints(boardList.values[boardPos].id));

    const sprints = sprintList.values.filter(sprint => sprint.state === 'active' || sprint.state === 'future');

    if (sprints.length === 0) {
      return null;
    }

    if (sprints.length > 1) {
      const sprintPos = await Ask.askList('Sprint:', sprints.map(sprint => sprint.name));
      return {
        boardId: boardList.values[boardPos].id,
        sprintId: sprints[sprintPos].id
      };
    }

    return {
      boardId: boardList.values[boardPos].id,
      sprintId: sprints[0].id
    };
  }

  static async add(jira, id) {
    const data = await Sprint.pickSprint(jira);
    if (data === null) {
      console.log("No active sprints");
      return;
    }

    await jira.spin('Adding the issue to the sprint...',
      jira.apiAgileRequest(`/sprint/${data.sprintId}/issue`, {
        method: 'POST',
        followAllRedirects: true,
        body: {
          issues: [id]
        }
      }));
  }
};

export default Sprint;