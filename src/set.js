import Ask from './ask.js';
import Command from './command.js';
import Field from './field.js';
import Jira from './jira.js';
import ErrorHandler from './errorhandler.js';
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

        try {
          await jira.spin('Updating the issue...', jira.api.updateIssue(id, issue));
        } catch (e) {
          ErrorHandler.showError(jira, e);
        }
      });

    setCmd.command('status')
      .description('Change the status')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);

        let transitionList;
        try {
          transitionList = await jira.spin('Retrieving transitions...', jira.api.listTransitions(id));
        } catch (e) {
          ErrorHandler.showError(jira, e);
          return;
        }

        const transitionPos = await Ask.askList('Status:', transitionList.transitions.map(transition => transition.name));
        const transition = {
          transition: {
            id: transitionList.transitions[transitionPos].id
          }
        };

        try {
          await jira.spin('Updating the issue...', jira.api.transitionIssue(id, transition));
        } catch (e) {
          ErrorHandler.showError(jira, e);
        }
      });

    setCmd.command('custom')
      .description('Set a custom field')
      .argument('<field>', 'The field name')
      .argument('<id>', 'The issue ID')
      .action(async (fieldName, id) => {
        const jira = new Jira(program);

        const field = await Field.askFieldIfSupported(jira, fieldName);
        if (!field) {
          console.log("Unsupported field type");
          return;
        }

        const data = {};
        data[field.key] = field.value;

        try {
          await jira.spin('Updating the issue...', jira.api.updateIssue(id, {
            fields: {
              ...data
            }
          }));
        } catch (e) {
          ErrorHandler.showError(jira, e);
        }
      });
  }
};

export default Set;