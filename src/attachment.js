// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import Command from './command.js';
import Field from './field.js';
import Issue from './issue.js';
import Jira from './jira.js';
import Utils from './utils.js';

class Attachment extends Command {
  addOptions(program) {
    const cmd = program.command('attachment')
      .description('Play with attachments');
    cmd.command('get')
      .description('Get the attachment')
      .argument('<issueID>', 'The issue ID')
      .argument('<attachmentID>', 'The attachment ID')
      .action(async (issueId, attachmentId) => {
        const jira = new Jira(program);

        const resultFields = await Field.listFields(jira);

        const result = await jira.spin('Running query...', jira.api.findIssue(issueId));
        const issue = Issue.replaceFields(result, resultFields);

        const attachment = issue.fields['Attachment'].find(attachment => attachment.id === attachmentId);
        const attachmentData = await jira.spin('Retriving attachment...', jira.api.downloadAttachment(attachment));
        process.stdout.write(attachmentData);
      });

    // TODO: delete attachment
    // TODO: upload attachment
  }
};

export default Attachment;