import inquirer from 'inquirer';

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

    const projectNames = [];
    const projectKeys = [];
    const issueTypes = [];

    meta.projects.forEach(project => {
      projectNames.push(project.name);
      projectKeys.push(project.key);
      issueTypes.push(project.issuetypes);
    });

    const projectQuestion = [{
      type: 'list',
      name: 'project',
      message: 'Project:',
      choices: projectNames,
      filter: name => {
        const pos = projectNames.indexOf(name);
        return {
          pos,
          name,
          key: projectKeys[pos]
        };
      }
    }];

    const projectAnswer = await inquirer.prompt(projectQuestion);

    jira.latestProject = projectAnswer.project.key
    jira.syncConfig();

    return {
      issueTypes: issueTypes[projectAnswer.project.pos],
      ...projectAnswer.project
    };
  }
};

export default Project;