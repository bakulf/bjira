import color from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';

import Command from './command.js';

class Init extends Command {
  addOptions(program) {
    program.command('init')
           .description('Create the initial config file')
           .action(async () => {
      const opts = program.opts();
      const questions = [
        {
          type: ' input',
          name: 'host',
          message: 'Provide your jira host:',
          default: 'example.atlassian.net'
        },
        {
          type: 'input',
          name: 'username',
          message: 'Please provide your jira username:'
        },
        {
          type: 'password',
          name: 'password',
          message: 'API token:'
        },
        {
          type: 'confirm',
          name: 'protocol',
          message: 'Enable HTTPS Protocol?'
        }
      ];

      const answers = await inquirer.prompt(questions);

      const config = {
        jira: {
          protocol: answers.protocol ? 'https' : 'http',
          host: answers.host.trim(),
          username: answers.username.trim(),
          password: answers.password.trim(),
          apiVersion: '2',
          strictSSL: true,
        },
      };

      fs.writeFileSync(opts.config, JSON.stringify(config, null, 2), 'utf8');
      console.log(`Config file succesfully created in: ${color.green(opts.config)}`);
    });
  }
};

export default Init;
