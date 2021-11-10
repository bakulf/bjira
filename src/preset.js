import color from 'chalk';
import inquirer from 'inquirer';

import Command from './command.js';
import Jira from './jira.js';
import Table from './table.js';

class Preset extends Command {
  addOptions(program) {
    const presetCmd = program.command('preset')
      .description('Touch preset queries');
    presetCmd.command('create')
      .description('create a new preset')
      .argument('<name>', 'the name of the preset (use $$$ for variables)')
      .argument('<query>', 'the query')
      .action(async (name, query) => {
        const jira = new Jira(program);

        if (name in jira.config.presets) {
          console.log('This preset already exists');
          return;
        }

        jira.config.presets[name] = query;
        jira.syncConfig();

        console.log('Config file succesfully updated');
      });

    presetCmd.command('remove')
      .description('remove a preset')
      .argument('<name>', 'the name of the preest')
      .action(async name => {
        const jira = new Jira(program);

        delete jira.config.presets[name];
        jira.syncConfig();
        console.log('Config file succesfully updated');
      });

    presetCmd.command('list')
      .description('list the presets')
      .action(async () => {
        const jira = new Jira(program);

        const table = new Table({
          head: ['Name', 'Query']
        });

        Object.keys(jira.config.presets).forEach(key => table.addRow([color.blue(key),
          color.green(jira.config.presets[key])
        ]));
        console.log(table.toString());
      });
  }
};

export default Preset;