import color from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';

import Command from './command.js';
import Jira from './jira.js';

class Create extends Command {
  addOptions(program) {
    const cmd = program.command('create')
                       .description('Create a new issue')
                       .action(async () => {
      const jira = new Jira(program);

      const meta = await jira.spin('Retrieving metadata...',
                                   jira.apiRequest('/issue/createmeta'));

      const projectNames = [];
      const projectKeys = [];
      const issueTypes = [];

      meta.projects.forEach(project => {
        projectNames.push(project.name);
        projectKeys.push(project.key);
        issueTypes.push(project.issuetypes);
      });

      const projectQuestion = [
        {
          type: 'list',
          name: 'project',
          message: 'Project:',
          choices: projectNames,
          filter: name => {
            const pos = projectNames.indexOf(name);
            return {pos, name, key: projectKeys[pos]};
          }
        }
      ];

      const projectAnswer = await inquirer.prompt(projectQuestion);

      const issueQuestions = [
        {
          type: 'list',
          name: 'issueType',
          message: 'Issue type:',
          choices: issueTypes[projectAnswer.project.pos],
          filter: name => issueTypes[projectAnswer.project.pos].find(obj => obj.name === name)
        },
        {
          type: 'input',
          name: 'issueName',
          message: 'Please provide the issue name:',
          default: 'New Issue'
        },
        {
          type: 'confirm',
          name: 'assign',
          message: 'Do you want to assign it?'
        }
      ];

      // Ask for the issue name and type
      const issueAnswers = await inquirer.prompt(issueQuestions);

      // Create the issue object
      const newIssue = {
        fields: {
          project: {
            key: projectAnswer.project.key
          },
          summary: issueAnswers.issueName,
          issuetype: {
            id: issueAnswers.issueType.id
          }
        }
      };

      if (issueAnswers.assign) {
        const userList = await jira.spin('Retrieving users...', jira.api.getUsers(0, 1000));
        const userNames = [];
        const userIds = [];
        userList.forEach(user => {
          if (user.active) {
            userNames.push(user.displayName);
            userIds.push(user.accountId);
          }
        });

        const assigneeQuestion = [
          {
            type: 'list',
            name: 'assignee',
            message: 'Assignee:',
            choices: userNames,
            filter: name => {
              const pos = userNames.indexOf(name);
              return {pos, name, id: userIds[pos]};
            }
          }
        ];

        const assigneeAnswer = await inquirer.prompt(assigneeQuestion);
        newIssue.fields.assignee = { accountId: assigneeAnswer.assignee.id };
      }

      if (issueAnswers.issueType.name === 'Task') {
        const parentIssueQuestion = [
          {
            type: 'input',
            name: 'issueParentName',
            message: 'Please provide the epic:'
          }
        ];

        const parentIssueAnswer = await inquirer.prompt(parentIssueQuestion);
        if (parentIssueAnswer.issueParentName !== '') {
          newIssue.fields.parent = {
            key: parentIssueAnswer.issueParentName
          };
        }
      }

      if (issueAnswers.issueType.name == 'Epic') {
        const epicQuestion = [
          {
            type: 'input',
            name: 'epicDescription',
            message: 'Description:'
          }
        ];

        const epicAnswer = await inquirer.prompt(epicQuestion);
        newIssue.fields.description = epicAnswer.epicDescription;
      }

/* TODO: priority doesn't work...
      const priorityQuestion = [
        {
          type: 'confirm',
          name: 'priority',
          message: 'Do you want to set a priority?'
        }
      ];

      // Ask for the issue name and type
      const priorityAnswer = await inquirer.prompt(priorityQuestion);
      if (priorityAnswer.priority) {
        const priorities = await jira.spin('Retrieving priorities...',
                                           jira.api.listPriorities());
        const priorityNames = [];
        const priorityIds = [];

        priorities.forEach(priority => {
          priorityNames.push(priority.name);
          priorityIds.push(priority.id);
        });

        const priorityLevelQuestion = [
          {
            type: 'list',
            name: 'priority',
            message: 'Priority:',
            choices: priorityNames,
            filter: name => {
              const pos = priorityNames.indexOf(name);
              return {pos, name, id: priorityIds[pos]};
            }
          }
        ];

        // Ask for the issue name and type
        const priorityLevelAnswer = await inquirer.prompt(priorityLevelQuestion);
        newIssue.fields.priority = {
          id: priorityLevelAnswer.priority.id
        };
      }
*/

      const issue = await jira.spin('Creating the issue...', jira.api.addNewIssue(newIssue));
      let config = jira.config.jira;

      console.log('');
      console.log('New issue: ' + color.bold.red(issue.key));
      console.log(config.protocol + '://' + config.host + '/browse/' + issue.key);
      console.log('');
    });
  }
};

export default Create;
