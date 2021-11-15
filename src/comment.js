import execa from 'execa';
import fs from 'fs';
import temp from 'temp';

import Command from './command.js';
import Jira from './jira.js';

class Comment extends Command {
  addOptions(program) {
    const commentCmd = program.command('comment')
      .description('Add a comment to an issue')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        temp.track();

        let file;
        try {
          file = temp.openSync('jira');
        } catch (e) {
          console.log("Failed to open a temporary file");
          return;
        }

        const code = await new Promise(resolve => {
          const subprocess = execa(process.env.EDITOR, [file.path], {
            detached: true,
            stdio: 'inherit',
          });

          subprocess.on('error', () => resolve(-1));
          subprocess.on('close', resolve);
        });

        if (code !== 0) {
          console.log("Failed to run the app");
          return;
        }

        let comment = fs.readFileSync(file.path);
        comment = comment.toString().trim();
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