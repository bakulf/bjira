#!/usr/bin/env node

// SPDX-FileCopyrightText: 2021-2022 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import program from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';

import Attachment from './attachment.js';
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

const DEFAULT_CONFIG_FILE = path.join(os.homedir(), ".bjira.json")

const commands = [
  new Attachment(),
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