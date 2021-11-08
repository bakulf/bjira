import program from 'commander';
import os from 'os';
import path from 'path';

import Comment from './comment.js';
import Create from './create.js';
import Init from './init.js';
import Issue from './issue.js';
import Preset from './preset.js';
import Project from './project.js';
import Query from './query.js';
import Run from './run.js';
import Set from './set.js';
import Sprint from './sprint.js';

const DEFAULT_CONFIG_FILE = path.join(os.homedir(), ".jira.json")

const commands = [
  new Comment(),
  new Create(),
  new Init(),
  new Issue(),
  new Preset(),
  new Project(),
  new Query(),
  new Run(),
  new Set(),
  new Sprint(),
];

program.version("0.0.1")

program.option('-c, --config <file>',
  `config file`,
  DEFAULT_CONFIG_FILE)
commands.forEach(command => command.addOptions(program));

program.parseAsync(process.argv);