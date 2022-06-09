// SPDX-FileCopyrightText: 2021-2022 Andrea Marchesini <baku@bnode.dev>
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

class Label extends Command {
  addOptions(program) {
    const labelCmd = program.command('label')
      .description('Play with labels');
    labelCmd.command('add')
      .description('Add a label to an issue')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);
        const resultFields = await Field.listFields(jira);
        const result = await jira.spin('Running query...', jira.api.findIssue(id));
        const issue = Issue.replaceFields(result, resultFields);

        const meta = await Project.metadata(jira, issue.fields['Project'].key, issue.fields['Issue Type'].name);
        const field = meta.projects.find(p => p.key === issue.fields['Project'].key)
          .issuetypes.find(i => i.name === issue.fields['Issue Type'].name).fields['labels'];
        if (!field) {
          console.log("This type does not support labels");
          return;
        }

        const label = await Ask.askCallback("Add label:", async input => {
          if (!input) return [];
          const data = await jira.api.doRequest({
            url: field.autoCompleteUrl + input
          })
          return JSON.parse(data).suggestions.map(label => label.label);
        });

        const labels = issue.fields['Labels'] || [];
        if (labels.includes(label)) {
          console.log("Duplicate label");
          return;
        }

        labels.push(label);

        const data = {};
        data[field.key] = labels;

        await jira.spin(`Updating issue ${id}...`, jira.api.updateIssue(id, {
          fields: {
            ...data
          }
        }));
      });

    labelCmd.command('remove')
      .description('Remove a label from an issue')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);
        const resultFields = await Field.listFields(jira);
        const result = await jira.spin('Running query...', jira.api.findIssue(id));
        const issue = Issue.replaceFields(result, resultFields);

        const meta = await Project.metadata(jira, issue.fields['Project'].key, issue.fields['Issue Type'].name);
        const field = meta.projects.find(p => p.key === issue.fields['Project'].key)
          .issuetypes.find(i => i.name === issue.fields['Issue Type'].name).fields['labels'];
        if (!field) {
          console.log("This type does not support labels");
          return;
        }

        let labels = issue.fields['Labels'] || [];
        if (labels.length === 0) {
          console.log("No labels");
          return;
        }

        let label = await Ask.askList("Remove label:", labels.map(label => ({
          name: label,
          value: label
        })));

        const data = {};
        data[field.key] = labels.filter(l => label != l)

        await jira.spin(`Updating issue ${id}...`, jira.api.updateIssue(id, {
          fields: {
            ...data
          }
        }));
      });
  }
};

export default Label;