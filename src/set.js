// SPDX-FileCopyrightText: 2021-2022 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import Ask from './ask.js';
import Command from './command.js';
import Field from './field.js';
import Issue from './issue.js';
import Jira from './jira.js';
import User from './user.js';

class Set extends Command {
  addOptions(program) {
    const setCmd = program.command('set')
      .description('Update fields in an issue');
    setCmd.command('assignee')
      .description('Assign the issue to somebody')
      .argument('<ID>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);
        await Set.assignIssue(jira, id);
      });

    setCmd.command('unassign')
      .description('Unassign the issue')
      .argument('<ID>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);

        const issue = {
          fields: {
            assignee: {
              accountId: null
            }
          }
        }

        await jira.spin(`Updating issue ${id}...`, jira.api.updateIssue(id, issue));
      });

    setCmd.command('status')
      .description('Change the status')
      .argument('<ID>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);
        await Set.setStatus(jira, id);
      });

    setCmd.command('custom')
      .description('Set a custom field')
      .argument('<field>', 'The field name')
      .argument('<id>', 'The issue ID')
      .action(async (fieldName, id) => {
        const jira = new Jira(program);

        const resultFields = await Field.listFields(jira);
        const result = await jira.spin('Running query...', jira.api.findIssue(id));
        const issue = Issue.replaceFields(result, resultFields);

        const customField = jira.fields.find(
          field => field.projectName === issue.fields['Project'].key &&
          field.issueTypeName === issue.fields['Issue Type'].name &&
          field.fieldName === fieldName);
        if (!customField) {
          console.log("Unknown custom field");
          return;
        }

        await Set.setCustomField(jira, customField, id, issue.fields[customField.fieldName]);
      });
  }

  static async assignIssue(jira, id) {
    const userList = await User.pickUser(jira);
    const activeUsers = userList.filter(user => user.active);
    const assigneeId = await Ask.askList('Assignee:',
      activeUsers.map(user => ({
        name: user.displayName,
        value: user.accountId
      })));

    const issue = {
      fields: {
        assignee: {
          accountId: assigneeId
        }
      }
    }

    await jira.spin(`Updating issue ${id}...`, jira.api.updateIssue(id, issue));
  }

  static async setCustomField(jira, customField, id, defaultValue = null) {
    const field = await Field.fetchAndAskFieldIfSupported(jira, customField, defaultValue);
    if (field === null) {
      console.log("Unsupported field type");
      return;
    }

    const data = {};
    data[field.key] = field.value;

    await jira.spin(`Updating issue ${id}...`, jira.api.updateIssue(id, {
      fields: {
        ...data
      }
    }));
  }

  static async setStatus(jira, id) {
    const transitionList = await jira.spin('Retrieving transitions...', jira.api.listTransitions(id));
    const transitionData = await Ask.askList('Status:',
      transitionList.transitions.filter(transition => transition.isAvailable).map(transition => ({
        name: transition.name,
        value: transition
      })));

    const transition = {
      transition: {
        id: transitionData.id
      }
    };

    for (const field of Object.keys(transitionData.fields)) {
      const fieldData = transitionData.fields[field];

      if (!fieldData.required) continue;

      if (!Field.isSupported(fieldData)) {
        console.log(`Field ${field} is required but it's not supported`);
        return;
      }

      const fieldValue = await Field.askFieldIfSupported(fieldData);
      transition.transition[fieldValue.key] = fieldValue.value;
    }

    await jira.spin(`Updating issue ${id}...`, jira.api.transitionIssue(id, transition));
  }
};

export default Set;