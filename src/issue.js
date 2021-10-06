import color from 'chalk';
import Table from 'cli-table3';

import Command from './command.js';
import Jira from './jira.js';

const DEFAULT_QUERY_LIMIT = 20;

class Issue extends Command {
  addOptions(program) {
    const cmd = program.command('issue')
                       .description('Show an issue')
                       .argument('<id>', 'The issue ID')
                       .action(async id => {
      const jira = new Jira(program);

      const result = await jira.spin('Running query...',
                                     jira.api.findIssue(id));
      // TODO
      console.log(JSON.stringify(result, null, 2));
    });
  }
};

export default Issue;
