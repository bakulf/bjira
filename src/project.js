import color from 'chalk';
import Table from 'cli-table3';

import Command from './command.js';
import Jira from './jira.js';

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
        chars: jira.tableChars,
        head: ['Key', 'Name']
      });
  
      projects.forEach(project => table.push([ color.blue( project.key ), project.name ]));
      console.log(table.toString());
    });
  }
};

export default Project;
