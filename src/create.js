import color from 'chalk';
import inquirer from 'inquirer';

import Command from './command.js';
import Jira from './jira.js';
import Issue from './issue.js';
import Project from './project.js';
import User from './user.js';

class Create extends Command {
  addOptions(program) {
    const cmd = program.command('create')
      .description('Create a new issue')
      .action(async () => {
        const jira = new Jira(program);

        const project = await Project.pickProject(jira);

        const issueQuestions = [{
          type: 'list',
          name: 'issueType',
          message: 'Issue type:',
          choices: project.issueTypes,
          filter: name => project.issueTypes.find(obj => obj.name === name)
        }, {
          type: 'input',
          name: 'summary',
          message: 'Summary:',
          default: 'New Issue'
        }, {
          type: 'input',
          name: 'description',
          message: 'Description:'
        }, {
          type: 'confirm',
          name: 'assign',
          message: 'Do you want to assign it?'
        }, ];

        // Ask for the issue name and type
        const issueAnswers = await inquirer.prompt(issueQuestions);

        // Create the issue object
        const newIssue = {
          fields: {
            project: {
              key: project.key
            },
            summary: issueAnswers.summary,
            issuetype: {
              id: issueAnswers.issueType.id
            }
          }
        };

        if (issueAnswers.description) {
          newIssue.fields.description = issueAnswers.description;
        }

        if (issueAnswers.assign) {
          const userList = await User.pickUser(jira);

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
          newIssue.fields.assignee = {
            accountId: assigneeAnswer.assignee.id
          };
        }

        if (issueAnswers.issueType.name === 'Task') {
          const parentIssueQuestion = [{
            type: 'input',
            name: 'issueParentName',
            message: 'Please provide the epic:'
          }];

          const parentIssueAnswer = await inquirer.prompt(parentIssueQuestion);
          if (parentIssueAnswer.issueParentName !== '') {
            newIssue.fields.parent = {
              key: parentIssueAnswer.issueParentName
            };
          }
        }

        const issue = await jira.spin('Creating the issue...', jira.api.addNewIssue(newIssue));

        console.log('');
        console.log('New issue: ' + color.bold.red(issue.key));
        console.log(color.blue(Issue.url(jira, issue.key)));
        console.log('');
      });
  }
};

export default Create;