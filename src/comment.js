// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import Command from './command.js';
import Jira from './jira.js';
import Utils from './utils.js';

class Comment extends Command {
  addOptions(program) {
    const commentCmd = program.command('comment')
      .description('Add a comment to an issue')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const comment = await Utils.writeInTempFile();
        if (!comment === null) {
          return;
        }

        if (comment === "") {
          console.log("No comment message");
          return;
        }

        const jira = new Jira(program);

        await jira.spin('Adding the comment...', jira.api.addComment(id, comment));
      });
  }
};

export default Comment;