// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import color from 'chalk';

import Ask from './ask.js';
import Command from './command.js';
import Field from './field.js';
import Jira from './jira.js';
import Issue from './issue.js';
import Project from './project.js';
import Query from './query.js';
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
        const issueType = await Ask.askList('Issue type:',
          project.issueTypes.map(issueType => ({
            name: issueType.name,
            value: {
              name: issueType.name,
              id: issueType.id
            }
          })));

        const meta = await Project.metadata(jira, project.key, issueType.name);

        const newIssue = {
          fields: {
            project: {
              key: project.key
            },
            summary: await Ask.askString('Summary:', 'New Issue'),
            issuetype: {
              id: issueType.id
            }
          }
        };

        if (await Ask.askBoolean('Do you want to write a description?')) {
          const description = await Utils.writeInTempFile();
          if (description) {
            newIssue.fields.description = description;
          }
        }

        const issueFields = meta.projects.find(p => p.key === project.key)
          .issuetypes.find(i => i.name === issueType.name).fields;
        const requiredFields = Object.keys(issueFields).filter(
          key => issueFields[key].required &&
          Field.isSupported(issueFields[key]) &&
          !["issuetype", "summary", "description", "project"].includes(key)).map(key => issueFields[key]);

        for (const field of requiredFields) {
          const fieldData = await Field.askFieldIfSupported(field);
          newIssue.fields[fieldData.key] = fieldData.value;
        }

        if (issueType.name !== 'Epic' &&
          await Ask.askBoolean('Do you want to set a parent epic?')) {
          const result = await Query.runQuery(jira, `project = "${project.key}" and type = "epic"`, 999999);
          if (!result.issues || result.issues.length === 0) {
            console.log("No epics yet.");
          } else {
            const resultFields = await Field.listFields(jira);
            result.issues.forEach(epic => Issue.replaceFields(epic, resultFields));

            const parentKey = await Ask.askList('Choose the epic:',
              result.issues.map(epic => ({
                name: `${epic.key} - ${epic.fields['Summary']}`,
                value: epic.key
              })));
            newIssue.fields.parent = {
              key: parentKey
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

        const customFields = jira.fields.filter(
          field => field.projectName === project.key &&
          field.issueTypeName === issueType.name);
        if (customFields.length > 0 && await Ask.askBoolean('Do you want to set custom fields?')) {
          for (let customField of customFields) {
            await Set.setCustomField(jira, customField, issue.key);
          }
        }

        if (await Ask.askBoolean('Do you want to add it to the current sprint?')) {
          await Sprint.add(jira, issue.key);
        }
      });
  }
};

export default Create;