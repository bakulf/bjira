import Ask from './ask.js';
import Command from './command.js';
import Field from './field.js';
import Jira from './jira.js';
import User from './user.js';

class Set extends Command {
  addOptions(program) {
    const setCmd = program.command('set')
      .description('Update fields in an issue');
    setCmd.command('assignee')
      .description('Assign the issue to somebody')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);
        await Set.assignIssue(jira, id);
      });

    setCmd.command('unassign')
      .description('Unassign the issue')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);

        const issue = {
          fields: {
            assignee: {
              accountId: null
            }
          }
        }

        await jira.spin('Updating the issue...', jira.api.updateIssue(id, issue));
      });

    setCmd.command('status')
      .description('Change the status')
      .argument('<id>', 'The issue ID')
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
        await Set.setCustomField(jira, fieldName, id);
      });
  }

  static async assignIssue(jira, id) {
    const userList = await User.pickUser(jira);
    const activeUsers = userList.filter(user => user.active);
    const assignee = await Ask.askList('Assignee:', activeUsers.map(user => user.displayName));

    const issue = {
      fields: {
        assignee: {
          accountId: activeUsers[assignee].accountId
        }
      }
    }

    await jira.spin('Updating the issue...', jira.api.updateIssue(id, issue));
  }

  static async setCustomField(jira, fieldName, id) {
    const field = await Field.askFieldIfSupported(jira, fieldName);
    if (!field) {
      console.log("Unsupported field type");
      return;
    }

    const data = {};
    data[field.key] = field.value;

    await jira.spin('Updating the issue...', jira.api.updateIssue(id, {
      fields: {
        ...data
      }
    }));
  }

  static async setStatus(jira, id) {
    const transitionList = await jira.spin('Retrieving transitions...', jira.api.listTransitions(id));
    const transitionPos = await Ask.askList('Status:', transitionList.transitions.map(transition => transition.name));
    const transition = {
      transition: {
        id: transitionList.transitions[transitionPos].id
      }
    };

    await jira.spin('Updating the issue...', jira.api.transitionIssue(id, transition));
  }
};

export default Set;