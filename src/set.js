// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
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
      .argument('<IDs...>', 'The issue IDs')
      .action(async ids => {
        const jira = new Jira(program);
        await Set.assignIssue(jira, ids);
      });

    setCmd.command('unassign')
      .description('Unassign the issue')
      .argument('<IDs...>', 'The issue IDs')
      .action(async ids => {
        const jira = new Jira(program);

        const issue = {
          fields: {
            assignee: {
              accountId: null
            }
          }
        }

        for (const id of ids) {
          await jira.spin(`Updating issue ${id}...`, jira.api.updateIssue(id, issue));
        }
      });

    setCmd.command('status')
      .description('Change the status')
      .argument('<IDs...>', 'The issue IDs')
      .action(async ids => {
        const jira = new Jira(program);
        await Set.setStatus(jira, ids);
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

        await Set.setCustomField(jira, customField, id);
      });
  }

  static async assignIssue(jira, ids) {
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

    for (const id of ids) {
      await jira.spin(`Updating issue ${id}...`, jira.api.updateIssue(id, issue));
    }
  }

  static async setCustomField(jira, customField, id) {
    const field = await Field.fetchAndAskFieldIfSupported(jira, customField);
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

  static async setStatus(jira, ids) {
    const transitionList = await jira.spin('Retrieving transitions...', jira.api.listTransitions(ids[0]));
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

      transition.transition[fieldData.key] = await Field.askFieldIfSupported(fieldData);
    }

    for (const id of ids) {
      await jira.spin(`Updating issue ${id}...`, jira.api.transitionIssue(id, transition));
    }
  }
};

export default Set;