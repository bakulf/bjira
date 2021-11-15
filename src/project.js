import Ask from './ask.js';
import Command from './command.js';
import Jira from './jira.js';
import Table from './table.js';

class Project extends Command {
  addOptions(program) {
    const cmd = program.command("project")
      .description("Do things related to projects")
    cmd.command("list")
      .description("Show the list of projects")
      .action(async () => {
        const jira = new Jira(program);

        const projects = await jira.spin("Loading projects...", jira.api.listProjects());

        const table = new Table({
          head: ['Key', 'Name']
        });

        projects.forEach(project => table.addRow([{
          color: "blue",
          text: project.key
        }, project.name]));
        console.log(table.toString());
      });
  }

  static async pickProject(jira) {
    const meta = await jira.spin('Retrieving metadata...',
      jira.apiRequest('/issue/createmeta'));

    meta.projects.sort((a, b) => {
      if (a.key === jira.latestProject) {
        return -1;
      }

      if (b.key === jira.latestProject) {
        return 1;
      }

      return a.name > b.name;
    });

    const projectPos = await Ask.askList('Project:', meta.projects.map(project => project.name));
    const project = meta.projects[projectPos];

    jira.latestProject = project.key;
    jira.syncConfig();

    return {
      name: project.name,
      key: project.key,
      issueTypes: project.issuetypes,
    };
  }
};

export default Project;