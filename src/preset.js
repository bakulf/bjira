import color from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import Table from 'cli-table3';

import Command from './command.js';
import Jira from './jira.js';

class Preset extends Command {
  addOptions(program) {
    const presetCmd = program.command('preset')
      .description('Touch preset queries');
    presetCmd.command('create')
      .description('create a new preset')
      .argument('<name>', 'the name of the preest')
      .argument('<query>', 'the query')
      .action(async (name, query) => {
        const opts = program.opts();
        const jira = new Jira(program);

        if (name in jira.config.presets) {
          console.log('This preset already exists');
          return;
        }

        jira.config.presets[name] = query;
        fs.writeFileSync(opts.config, JSON.stringify(jira.config, null, 2), 'utf8');
        console.log('Config file succesfully updated');

      });

    presetCmd.command('remove')
      .description('remove a preset')
      .argument('<name>', 'the name of the preest')
      .action(async name => {
        const opts = program.opts();
        const jira = new Jira(program);

        delete jira.config.presets[name];
        fs.writeFileSync(opts.config, JSON.stringify(jira.config, null, 2), 'utf8');
        console.log('Config file succesfully updated');
      });

    presetCmd.command('list')
      .description('list the presets')
      .action(async () => {
        const opts = program.opts();
        const jira = new Jira(program);

        const table = new Table({
          chars: jira.tableChars,
          head: ['Name', 'Query']
        });

        Object.keys(jira.config.presets).forEach(key => table.push([color.blue(key),
          color.green(jira.config.presets[key])
        ]));
        console.log(table.toString());
      });
  }
};

export default Preset;