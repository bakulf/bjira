import inquirer from 'inquirer';
import Table from 'cli-table3';

import Command from './command.js';
import Jira from './jira.js';
import ErrorHandler from './errorhandler.js';
import Project from './project.js';

class Sprint extends Command {
  addOptions(program) {
    const sprintCmd = program.command('sprint')
                       .description('Play with sprints');
    sprintCmd.command('add')
             .description('Add an issue to a sprint')
             .argument('<id>', 'The issue ID')
             .action(async id => {
      const jira = new Jira(program);

      const sprintId = await Sprint.pickSprint(jira);
      if (sprintId === 0) {
        console.log("No active sprints");
        return;
      }

      try {
        await jira.spin('Adding the issue to the sprint...',
                        jira.apiAgileRequest(`/sprint/${sprintId}/issue`,{
                          method: 'POST',
                          followAllRedirects: true,
                          body: {
                            issues: [id]
                        }}));
      } catch(e) {
        ErrorHandler.showError(jira, e);
      }
    });

    sprintCmd.command('remove')
             .description('Remove an issue from a sprint')
             .argument('<id>', 'The issue ID')
             .action(async id => {
      const jira = new Jira(program);

      try {
        await jira.spin('Adding the issue to the sprint...',
                        jira.apiAgileRequest("/backlog/issue",{
                          method: 'POST',
                          followAllRedirects: true,
                          body: {
                            issues: [id]
                          }}));
      } catch(e) {
        ErrorHandler.showError(jira, e);
      }
    });
  }

  static async pickSprint(jira) {
    const project = await Project.pickProject(jira);
    const boardList = await jira.spin('Retrieving boards...',
                                      jira.api.getAllBoards(undefined, undefined, undefined, undefined,
                                                            project.key));

    const boardNames = [];
    const boardIds = [];

    boardList.values.forEach(board => {
      boardNames.push(board.name);
      boardIds.push(board.id);
    });

    const boardQuestion = [
      {
        type: 'list',
        name: 'board',
        message: 'Board:',
        choices: boardNames,
        filter: name => {
          const pos = boardNames.indexOf(name);
          return {pos, name, id: boardIds[pos]};
        }
      }
    ];

    const boardAnswer = await inquirer.prompt(boardQuestion);

    const sprintList = await jira.spin('Retrieving sprints...',
                                      jira.api.getAllSprints(boardAnswer.board.id));

    const sprintNames = [];
    const sprintIds = [];

    sprintList.values.forEach(sprint => {
      if (sprint.state === 'active' || sprint.state === 'future') {
        sprintNames.push(sprint.name);
        sprintIds.push(sprint.id);
      }
    });

    if (sprintNames.length === 0) {
      return 0;
    }

    let sprintId = sprintIds[0];

    if (sprintNames.length > 1) {
      const sprintQuestion = [
        {
          type: 'list',
          name: 'sprint',
          message: 'Board:',
          choices: sprintNames,
          filter: name => {
            const pos = sprintNames.indexOf(name);
            return {pos, name, id: sprintIds[pos]};
          }
        }
      ];

      const sprintAnswer = await inquirer.prompt(sprintQuestion);
      sprintId = sprintAnswer.sprint.id;
    }

    return sprintId;
  }
};

export default Sprint;
