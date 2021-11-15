import color from 'chalk';

import Ask from './ask.js';
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

        const description = await Ask.askString('Description:');
        if (description) {
          newIssue.fields.description = description;
        }

        if (await Ask.askBoolean('Do you want to assign it?')) {
          const userList = await User.pickUser(jira);
          const activeUsers = userList.filter(user => user.active);
          const assignee = await Ask.askList('Assignee:', activeUsers.map(user => user.displayName));
          newIssue.fields.assignee = {
            accountId: activeUsers[assignee].accountId,
          };
        }

        if (project.issueTypes[issueTypePos].name === 'Task') {
          const parentIssue = await Ask.askString('Please provide the epic:');
          if (parentIssue !== '') {
            newIssue.fields.parent = {
              key: parentIssue
            };
          }
        }

        jira.fields.forEach(fieldName => {
          const fieldValue = Field.askFieldIfSupported(jira, fieldName);
          if (fieldValue && fieldValue.value) {
            newIssue.fields[fieldValue.key] = fieldValue.value;
          }
        });

        const issue = await jira.spin('Creating the issue...', jira.api.addNewIssue(newIssue));

        console.log('');
        console.log('New issue: ' + color.bold.red(issue.key));
        console.log(color.blue(Issue.url(jira, issue.key)));
        console.log('');
      });
  }
};

export default Create;