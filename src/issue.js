// SPDX-FileCopyrightText: 2021-2026 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import Command from './command.js';
import Comment from './comment.js';
import ADF from './adf.js';
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
      .option('-s, --subissues', 'Show sub-issues, epic issues, and linked issues')
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
            'Parent', {
              color: "yellow",
              text: issue.fields['Parent']?.key
            }
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
                'Body', ADF.show(comment.body)
              ],
            ]);
          });
        }

        console.log(table.toString());

        if (cmd.opts().subissues) {
          console.log("\nSub-issues:");
          const children = await Query.runQuery(jira, `parent = "${id}"`);
          await Query.showIssues(jira, children.issues, children.isLast, resultFields, false);

          if (issue.fields['Issue Type'].name === 'Epic') {
            console.log("\nEpic issues:");
            const children = await jira.spin('Fetching child issues...', jira.api.getIssuesForEpic(id));
            await Query.showIssues(jira, children.issues, children.isLast, resultFields, false);
          }

          const issueLinksFieldName = resultFields.find(f => f.key === 'issuelinks')?.name || 'Issue Links';
          const issueLinks = issue.fields[issueLinksFieldName];
          if (issueLinks && issueLinks.length > 0) {
            console.log("\nLinked issues:");
            const linkedTable = new Table({
              head: ['Relation', 'Key', 'Status', 'Type', 'Assignee', 'Summary'],
              unresizableColumns: [0, 1],
            });
            const summaryField = resultFields.find(f => f.key === 'summary')?.name || 'Summary';
            const statusField = resultFields.find(f => f.key === 'status')?.name || 'Status';
            const typeField = resultFields.find(f => f.key === 'issuetype')?.name || 'Issue Type';
            const assigneeField = resultFields.find(f => f.key === 'assignee')?.name || 'Assignee';
            for (const link of issueLinks) {
              const linkedStub = link.inwardIssue || link.outwardIssue;
              const direction = link.inwardIssue ? link.type.inward : link.type.outward;
              if (linkedStub) {
                const linkedResult = await jira.spin(`Fetching ${linkedStub.key}...`, jira.api.findIssue(linkedStub.key));
                const linked = Issue.replaceFields(linkedResult, resultFields);
                linkedTable.addRow([
                  direction,
                  { color: 'blue', text: linked.key },
                  { color: 'green', text: linked.fields?.[statusField]?.name || '' },
                  { color: 'green', text: linked.fields?.[typeField]?.name || '' },
                  { color: 'yellow', text: Issue.showUser(linked.fields?.[assigneeField]) },
                  linked.fields?.[summaryField] || '',
                ]);
              }
            }
            console.log(linkedTable.toString());
          }

          const remoteLinks = await jira.spin('Fetching remote links...', jira.apiRequest(`/issue/${id}/remotelink`));
          if (remoteLinks && remoteLinks.length > 0) {
            console.log("\nRemote links:");
            const remoteTable = new Table({
              head: ['Relation', 'Title', 'URL'],
            });
            for (const link of remoteLinks) {
              remoteTable.addRow([
                link.relationship || '',
                link.object?.title || '',
                { color: 'blue', text: link.object?.url || '' },
              ]);
            }
            console.log(remoteTable.toString());
          }
        }

      });
  }

  static replaceFields(obj, fields) {
    if (Array.isArray(obj)) {
      obj.forEach((o, pos) => {
        obj[pos] = Issue.replaceFields(o, fields);
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