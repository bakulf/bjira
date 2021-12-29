// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import Command from './command.js';
import Field from './field.js';
import Jira from './jira.js';
import Project from './project.js';
import Query from './query.js';
import Table from './table.js';

const DEFAULT_QUERY_LIMIT = 20;

class Issue extends Command {
  static url(jira, id) {
    return `${jira.config.jira.protocol}://${jira.config.jira.host}/browse/${id}`;
  }

  addOptions(program) {
    const cmd = program.command('show')
      .description('Show an issue')
      .option('-a, --attachments', 'Show the attachments too')
      .option('-C, --comments', 'Show the comments too')
      .option('-s, --subissues', 'Show the comments too')
      .argument('<id>', 'The issue ID')
      .action(async id => {
        const jira = new Jira(program);

        const resultFields = await Field.listFields(jira);

        const result = await jira.spin('Running query...', jira.api.findIssue(id));
        const issue = Issue.replaceFields(result, resultFields);

        let epicIssue = null;
        if (issue.fields['Epic Link']) {
          const epicResult = await jira.spin('Fetching the epic issue...',
            jira.api.findIssue(issue.fields['Epic Link']));
          epicIssue = Issue.replaceFields(epicResult, resultFields);
        }

        const table = new Table({});

        table.addRows([
          [
            'Summary', issue.fields['Summary'].trim()
          ],
          [
            'URL', {
              color: "blue",
              text: Issue.url(jira, id)
            },
          ],
          [
            'Status', {
              color: "green",
              text: issue.fields['Status'].name
            }
          ],
          [
            'Type', issue.fields['Issue Type'].name
          ],
          [
            'Project', issue.fields['Project'].name + ' (' + issue.fields['Project'].key + ')'
          ],
          [
            'Reporter', Issue.showUser(issue.fields['Reporter'])
          ],
          [
            'Assignee', Issue.showUser(issue.fields['Assignee'])
          ],
          [
            'Epic Link', {
              color: "yellow",
              text: this.showEpicIssue(epicIssue)
            }
          ],
          [
            'Labels', issue.fields['Labels'].join(', ')
          ],
          [
            'Sprint', {
              color: "yellow",
              text: issue.fields['Sprint']?.map(sprint => this.showSprint(sprint)).join(', ')
            }
          ]
        ]);

        const customFields = jira.fields.filter(
          field => field.projectName === issue.fields['Project'].key &&
          field.issueTypeName === issue.fields['Issue Type'].name);
        if (customFields.length > 0) {
          const meta = await Project.metadata(jira, issue.fields['Project'].key, issue.fields['Issue Type'].name);
          customFields.forEach(field => {
            const fields = meta.projects.find(p => p.key === field.projectName)
              .issuetypes.find(i => i.name === field.issueTypeName).fields;
            for (const name in fields) {
              const fieldObj = fields[name];
              if (fieldObj.name === field.fieldName) {
                table.addRow([field.fieldName, Field.fieldValue(issue.fields[field.fieldName], fieldObj) || "unset"]);
              }
            }
          });
        }

        table.addRows([
          [
            '', ''
          ],
          [
            'Created on', issue.fields['Created']
          ],
          [
            'Updated on', issue.fields['Updated']
          ],
          [
            '', ''
          ],
          [
            'Description', issue.fields['Description']
          ],
          [
            '', ''
          ],
          [
            'Attachments', issue.fields['Attachment'].length
          ],
          [
            'Comments', issue.fields['Comment'].total
          ],
        ]);

        if (cmd.opts().attachments) {
          issue.fields['Attachment'].forEach(attachment => {
            table.addRows([
              [
                '', ''
              ],
              [
                'Attachment', {
                  color: "yellow",
                  text: attachment.id
                }
              ],
              [
                'Filename', attachment.filename
              ],
              [
                'Author', Issue.showUser(attachment.author)
              ],
              [
                'Size', attachment.size
              ],
              [
                'Mime-type', attachment.mimeType
              ],
              [
                'Created on', attachment['Created']
              ],
            ]);
          });
        }

        if (cmd.opts().comments) {
          issue.fields['Comment'].comments.forEach(comment => {
            table.addRows([
              [
                '', ''
              ],
              [
                'Comment', {
                  color: "yellow",
                  text: comment.id
                }
              ],
              [
                'Author', Issue.showUser(comment.author)
              ],
              [
                'Created on', comment['Created']
              ],
              [
                'Updated on', comment['Updated']
              ],
              [
                'Body', comment.body
              ],
            ]);
          });
        }

        console.log(table.toString());

        if (cmd.opts().subissues) {
          console.log("\nSub-issues:");
          const children = await Query.runQuery(jira, `parent = "${id}"`, 999999);
          await Query.showIssues(jira, children.issues, children.total, resultFields, false);

          if (issue.fields['Issue Type'].name === 'Epic') {
            console.log("\nEpic issues:");
            const children = await jira.spin('Fetching child issues...', jira.api.getIssuesForEpic(id));
            await Query.showIssues(jira, children.issues, children.total, resultFields, false);
          }
        }

      });
  }

  static replaceFields(obj, fields) {
    if (Array.isArray(obj)) {
      obj.forEach((o, pos) => {
        obj[o] = Issue.replaceFields(o, fields);
      });
    } else if (obj && typeof obj === "object") {
      Object.keys(obj).forEach(key => {
        if (obj[key] === null) {
          delete obj[key];
          return;
        }

        obj[key] = Issue.replaceFields(obj[key], fields);

        const field = fields.find(f => f.key == key);
        if (field) {
          obj[field.name] = obj[key];
          delete obj[key];
        }
      });
    }

    return obj;
  }

  static showUser(user) {
    if (!user) return "(null)";
    let str = user.displayName;
    if (user.emailAddress) str += ` (${user.emailAddress})`;
    return str;
  }

  showEpicIssue(issue) {
    if (!issue) return "";
    return `${issue.key} (${issue.fields['Summary'].trim()})`;
  }

  showSprint(sprint) {
    return `${sprint.name} (${sprint.state})`;
  }
};

export default Issue;