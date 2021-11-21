// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

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
      if (a.name < b.name) {
        return -1;
      }

      if (a.name > b.name) {
        return 1;
      }

      return 0;
    });

    const projects = [];
    if (jira.latestProject) {
      const latestProject = meta.projects.find(project => project.key === jira.latestProject);
      if (latestProject) {
        projects.push(`Latest: ${latestProject.name}`);
      }
    }

    meta.projects.forEach(project => projects.push(project.name));

    const projectPos = await Ask.askList('Project:', projects);
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