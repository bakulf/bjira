import color from 'chalk';
import Table from 'cli-table3';

import Command from './command.js';
import ErrorHandler from './errorhandler.js';
import Jira from './jira.js';
import Query from './query.js';

const DEFAULT_QUERY_LIMIT = 20;

class Run extends Command {
  addOptions(program) {
    const cmd = program.command('run')
                       .description('Run a preset')
                       .argument('<name>', 'The preset name')
                       .option('-l, --limit <limit>',
                               `Set the query limit. Default ${DEFAULT_QUERY_LIMIT}`,
                               DEFAULT_QUERY_LIMIT)
                       .action(async name => {
      const jira = new Jira(program);
      const opts = cmd.opts();

      if (!(name in jira.config.presets)) {
        console.log('This preset does not exist');
        return;
      }

      const resultFields = await jira.spin('Retrieving the fields...',
                                           jira.api.listFields());

      let expectedResult = opts.limit;
      let issues = [];

      while (issues.length < opts.limit) {
        let result;
        try {
          result = await jira.spin('Running query...',
                     jira.api.searchJira(jira.config.presets[name], {
                       startAt: issues.lengh,
                       maxResults: opts.limit - issues.length
                     }));
        } catch(e) {
          ErrorHandler.showError(jira, e);
          return;
        }

        if (result.warningMessages) {
          ErrorHandler.showWarningMessages(result.warningMessages);
          return;
        }

        issues = issues.concat(result.issues);
        if (issues.length >= result.total) break;
      }

      Query.showIssues(jira, issues, resultFields);
    });
  }
};

export default Run;
