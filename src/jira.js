import jiraClient from 'jira-client';
import fs from 'fs';
import ora from 'ora';

class Jira {
  constructor(program) {
    const opts = program.opts();

    if (!fs.existsSync(opts.config)) {
      console.log(`Config file ${opts.config} does not exist.`);
      process.exit();
      return;
    }

    this._config = JSON.parse(fs.readFileSync(opts.config));
    this._jiraClient = new jiraClient(this._config.jira);
  }

  get api() { return this._jiraClient; }

  get config() { return this._config; }

  get tableChars() {
    return { 'top': ' ', 'top-mid': '', 'top-left': '', 'top-right': '',
             'bottom': ' ', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
             'left': ' ', 'left-mid': '', 'mid': '', 'mid-mid': '', 'right': '',
             'right-mid': '', 'middle': ' ' };
  }

  async spin(msg, promise) {
    const spinner = ora(msg).start();

    try {
      const result = await promise;
      return result;
    } catch(e) {
      throw e;
    } finally {
      spinner.stop();
    }
  }
};

export default Jira;
