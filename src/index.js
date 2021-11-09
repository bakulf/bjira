#!/usr/bin/env node

import program from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';

import Comment from './comment.js';
import Create from './create.js';
import Field from './field.js';
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
  new Field(),
  new Init(),
  new Issue(),
  new Preset(),
  new Project(),
  new Query(),
  new Run(),
  new Set(),
  new Sprint(),
];

const pjson = JSON.parse(fs.readFileSync(new URL("../package.json",
  import.meta.url)));
program.version(pjson.version);

program.option('-c, --config <file>',
  `config file`,
  DEFAULT_CONFIG_FILE)
commands.forEach(command => command.addOptions(program));

program.parseAsync(process.argv);