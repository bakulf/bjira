import Ask from './ask.js';
import Command from './command.js';
import Jira from './jira.js';
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

        await jira.spin('Adding the issue to the sprint...',
          jira.apiAgileRequest(`/sprint/${sprintId}/issue`, {
            method: 'POST',
            followAllRedirects: true,
            body: {
              issues: [id]
            }
          }));
      });

    sprintCmd.command('remove')
      .description('Remove an issue from a sprint')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);

        await jira.spin('Adding the issue to the sprint...',
          jira.apiAgileRequest("/backlog/issue", {
            method: 'POST',
            followAllRedirects: true,
            body: {
              issues: [id]
            }
          }));
      });
  }

  static async pickSprint(jira) {
    const project = await Project.pickProject(jira);
    const boardList = await jira.spin('Retrieving boards...',
      jira.api.getAllBoards(undefined, undefined, undefined, undefined,
        project.key));

    const boardPos = await Ask.askList('Board:', boardList.values.map(board => board.name));

    const sprintList = await jira.spin('Retrieving sprints...',
      jira.api.getAllSprints(boardList.values[boardPos].id));

    const sprints = sprintList.values.filter(sprint => sprint.state === 'active' || sprint.state === 'future');

    if (sprints.length === 0) {
      return 0;
    }

    if (sprints.length > 1) {
      const sprintPos = await Ask.askList('Sprint:', sprints.map(sprint => sprint.name));
      return sprints[sprintPos].id;
    }

    return sprints[0].id;
  }
};

export default Sprint;