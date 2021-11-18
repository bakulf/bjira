// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import color from 'chalk';

import Ask from './ask.js';
import Command from './command.js';
import Jira from './jira.js';
import Issue from './issue.js';
import Project from './project.js';
import Set from './set.js';
import Sprint from './sprint.js';
import User from './user.js';
import Utils from './utils.js';

class Create extends Command {
  addOptions(program) {
    const cmd = program.command('create')
      .description('Create a new issue')
      .action(async () => {
        const jira = new Jira(program);

        const project = await Project.pickProject(jira);
        const issueTypePos = await Ask.askList('Issue type:', project.issueTypes.map(issueType => issueType.name));

        // Create the issue object
        const newIssue = {
          fields: {
            project: {
              key: project.key
            },
            summary: await Ask.askString('Summary:', 'New Issue'),
            issuetype: {
              id: project.issueTypes[issueTypePos].id
            }
          }
        };

        if (await Ask.askBoolean('Do you want to write a description?')) {
          const description = await Utils.writeInTempFile();
          if (description) {
            newIssue.fields.description = description;
          }
        }

        if (project.issueTypes[issueTypePos].name !== 'Epic') {
          const parentIssue = await Ask.askString('Please provide the epic:');
          if (parentIssue !== '') {
            newIssue.fields.parent = {
              key: parentIssue
            };
          }
        }

        const issue = await jira.spin('Creating the issue...', jira.api.addNewIssue(newIssue));

        console.log('');
        console.log('New issue: ' + color.bold.red(issue.key));
        console.log(color.blue(Issue.url(jira, issue.key)));
        console.log('');

        if (await Ask.askBoolean('Do you want to assign it?')) {
          await Set.assignIssue(jira, issue.key);
        }

        if (await Ask.askBoolean('Do you want to set a status?')) {
          await Set.setStatus(jira, issue.key);
        }

        if (jira.fields && jira.fields.length > 0 &&
          await Ask.askBoolean('Do you want to set custom fields?')) {
          for (let fieldName of jira.fields) {
            await Set.setCustomField(jira, fieldName, issue.key);
          }
        }

        if (await Ask.askBoolean('Do you want to add it to the current sprint?')) {
          await Sprint.add(jira, issue.key);
        }
      });
  }
};

export default Create;