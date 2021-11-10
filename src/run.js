import color from 'chalk';

import Command from './command.js';
import ErrorHandler from './errorhandler.js';
import Field from './field.js';
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

        let query = jira.config.presets[name];
        for (let i = 2; i < program.args.length; ++i) {
          const arg = program.args[i];
          if (!query.includes("$$$")) {
            console.log("Too many aguments for this query");
            return;
          }

          query = query.replace('$$$', this.escape(arg));
        }

        if (query.includes("$$$")) {
          console.log("More arguments are needed");
          return;
        }

        let resultFields;
        try {
          resultFields = await Field.listFields(jira);
        } catch (e) {
          ErrorHandler.showError(jira, e);
          return;
        }

        let expectedResult = opts.limit;
        let issues = [];

        while (issues.length < opts.limit) {
          let result;
          try {
            result = await jira.spin('Running query...',
              jira.api.searchJira(query, {
                startAt: issues.lengh,
                maxResults: opts.limit - issues.length
              }));
          } catch (e) {
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

  escape(str) {
    return str.replace(/\"/g, '\\\"');
  }
};

export default Run;