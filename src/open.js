// SPDX-FileCopyrightText: 2021-2022 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import execa from 'execa';
import color from 'chalk';

import Command from './command.js';
import Jira from './jira.js';
import Issue from './issue.js';

class Open extends Command {
  addOptions(program) {
    program.command('open')
      .description('Open an issue in the default browser')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);
        const url = Issue.url(jira, id);

        const {
          cmd,
          args
        } = this._browserOpener(url);

        try {
          const subprocess = execa(cmd, args, {
            detached: true,
            stdio: 'ignore'
          });
          subprocess.unref?.();
          console.log(color.blue(url));
        } catch (e) {
          console.log('Unable to open the browser automatically. Open this URL:');
          console.log(color.blue(url));
        }
      });
  }

  _browserOpener(url) {
    switch (process.platform) {
      case 'darwin':
        return {
          cmd: 'open', args: [url]
        };
      case 'win32':
        return {
          cmd: 'cmd', args: ['/c', 'start', '', url]
        };
      default:
        return {
          cmd: 'xdg-open', args: [url]
        };
    }
  }
};

export default Open;