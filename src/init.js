// SPDX-FileCopyrightText: 2021-2022 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import color from 'chalk';
import fs from 'fs';

import Ask from './ask.js';
import Command from './command.js';

class Init extends Command {
  addOptions(program) {
    program.command('init')
      .description('Create the initial config file')
      .action(async () => {
        const opts = program.opts();

        const config = {
          jira: {
            host: (await Ask.askString('Provide your jira host:', 'example.atlassian.net')).trim(),
            protocol: await Ask.askBoolean('Enable HTTPS Protocol?') ? 'https' : 'http',
            username: (await Ask.askString('Please provide your jira username:')).trim(),
            password: (await Ask.askPassword('API token:')).trim(),
            apiVersion: '3',
            strictSSL: true,
          },
          presets: {},
        };

        fs.writeFileSync(opts.config, JSON.stringify(config, null, 2), 'utf8');
        console.log(`Config file succesfully created in: ${color.green(opts.config)}`);
      });
  }
};

export default Init;