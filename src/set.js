import inquirer from 'inquirer';

import Command from './command.js';
import Jira from './jira.js';
import ErrorHandler from './errorhandler.js';

class Set extends Command {
  addOptions(program) {
    const setCmd = program.command('set')
      .description('Update fields in an issue');
    setCmd.command('assignee')
      .description('Assign the issue to somebody')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);

        const userList = await jira.spin('Retrieving users...', jira.api.getUsers(0, 1000));
        const userNames = [];
        const userIds = [];
        userList.forEach(user => {
          if (user.active) {
            userNames.push(user.displayName);
            userIds.push(user.accountId);
          }
        });

        const assigneeQuestion = [{
          type: 'list',
          name: 'assignee',
          message: 'Assignee:',
          choices: userNames,
          filter: name => {
            const pos = userNames.indexOf(name);
            return {
              pos,
              name,
              id: userIds[pos]
            };
          }
        }];

        const assigneeAnswer = await inquirer.prompt(assigneeQuestion);
        const issue = {
          fields: {
            assignee: {
              accountId: assigneeAnswer.assignee.id
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

        const transitionList = await jira.spin('Retrieving transitions...', jira.api.listTransitions(id));
        const transitionNames = [];
        const transitionIds = [];
        transitionList.transitions.forEach(transition => {
          transitionNames.push(transition.name);
          transitionIds.push(transition.id);
        });

        const transitionQuestion = [{
          type: 'list',
          name: 'transition',
          message: 'Status:',
          choices: transitionNames,
          filter: name => {
            const pos = transitionNames.indexOf(name);
            return {
              pos,
              name,
              id: transitionIds[pos]
            };
          }
        }];

        const transitionAnswer = await inquirer.prompt(transitionQuestion);

        const transition = {
          transition: {
            id: transitionAnswer.transition.id
          }
        };
        try {
          await jira.spin('Updating the issue...', jira.api.transitionIssue(id, transition));
        } catch (e) {
          ErrorHandler.showError(jira, e);
        }
      });

    setCmd.command('storypoint')
      .description('Set the story point')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);

        const question = [{
          type: 'number',
          name: 'point',
          message: 'Story point:',
        }];

        const answer = await inquirer.prompt(question);

        let resultFields;
        try {
          resultFields = await jira.spin('Retrieving the fields...',
            jira.api.listFields());
        } catch (e) {
          ErrorHandler.showError(jira, e);
          return;
        }

        let key;
        resultFields.forEach(field => {
          if (field.name === "Story Points") key = field.key;
        });

        if (!key) {
          console.log("Unable to find the story-point field.");
          return;
        }

        const storyPoint = {};
        storyPoint[key] = answer.point;

        try {
          await jira.spin('Updating the issue...', jira.api.updateIssue(id, {
            fields: {
              ...storyPoint
            }
          }));
        } catch (e) {
          ErrorHandler.showError(jira, e);
        }
      });
  }
};

export default Set;