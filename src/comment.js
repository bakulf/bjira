// SPDX-FileCopyrightText: 2021-2022 Andrea Marchesini <baku@bnode.dev>
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
        if (comment === null) {
          return;
        }

        if (comment === "") {
          console.log("No comment message");
          return;
        }

        const jira = new Jira(program);

        await jira.spin('Adding the comment...', jira.api.addComment(id, this.createComment(comment)));
      });
  }

  createComment(comment) {
    return {
      content: [{
        content: [{
          text: comment,
          "type": "text"
        }],
        type: "paragraph"
      }],
      type: "doc",
      version: 1
    }
  }

  static showComment(obj) {
    if (typeof obj === "string") return obj;

    switch (obj.type) {
      case 'doc':
      case 'paragraph':
        return obj.content.map(a => Comment.showComment(a)).join("");

      case 'text':
        return obj.text;

      case 'inlineCard':
        return obj.attrs.url;

      case 'status':
      case 'mention':
      case 'emoji':
        return obj.attrs.text;

      case 'hardBreak':
        return '\n';

      case 'date':
        const date = new Date(obj.attrs.timestamp * 1000);
        return date.toLocaleString();

      default:
        return '';
    }
  }
};

export default Comment;