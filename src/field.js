// SPDX-FileCopyrightText: 2021-2022 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import color from 'chalk';

import Ask from './ask.js';
import Command from './command.js';
import Jira from './jira.js';
import Project from './project.js';
import Table from './table.js';

class Field extends Command {
  addOptions(program) {
    const cmd = program.command("field")
      .description("Do things related to issue fields")
    cmd.command("listall")
      .description("Show the list of fields")
      .action(async () => {
        const jira = new Jira(program);

        const resultFields = await jira.spin('Retrieving the fields...',
          jira.apiRequest('/issue/createmeta?expand=projects.issuetypes.fields'));

        resultFields.projects.forEach(project => {
          console.log(`\nProject: ${color.blue(project.name)} (${color.blue(project.key)})`);
          project.issuetypes.forEach(issueType => {
            console.log(`\nIssue type: ${color.yellow(issueType.name)}`);

            const table = new Table({
              head: ['Name', 'Supported', 'Type']
            });

            for (const fieldName in issueType.fields) {
              const field = issueType.fields[fieldName];
              const supported = Field.isSupported(field);
              table.addRow([{
                color: "blue",
                text: field.name
              }, supported, supported ? field.schema?.type : ""]);
            }

            console.log(table.toString());
          });
        });
      });

    cmd.command("add")
      .description("Add a custom field to be shown")
      .argument('<project>', 'The project name')
      .argument('<issueType>', 'The issue type')
      .argument('<field>', 'The field name')
      .action(async (projectName, issueTypeName, fieldName) => {
        const jira = new Jira(program);

        const meta = await Project.metadata(jira, projectName, issueTypeName);
        const issueType = meta.projects.find(p => p.key === projectName)
          .issuetypes.find(i => i.name === issueTypeName);
        if (!issueType) {
          console.log(`Issue type ${issueTypeName} does not exist.`);
          return;
        }

        for (const name in issueType.fields) {
          const field = issueType.fields[name];
          if (field.name !== fieldName) continue;

          if (!Field.isSupported(field)) {
            console.log("Unsupported field.");
            return;
          }

          jira.addField(projectName, issueTypeName, fieldName);
          jira.syncConfig();

          console.log('Config file succesfully updated');
          return;
        }

        console.log(`Field ${fieldName} does not exist in Issue type ${issueTypeName} for project ${projectName}`);
      });

    cmd.command("remove")
      .description("Remove a custom field")
      .argument('<project>', 'The project name')
      .argument('<issueType>', 'The issue type')
      .argument('<field>', 'The field name')
      .action(async (projectName, issueTypeName, fieldName) => {
        const jira = new Jira(program);

        jira.removeField(projectName, issueTypeName, fieldName);
        jira.syncConfig();

        console.log('Config file succesfully updated');
      });

    cmd.command("list")
      .description("List the supported custom field")
      .action(async () => {
        const jira = new Jira(program);

        const table = new Table({
          head: ['Project', 'Issue Type', 'Name']
        });

        jira.fields.forEach(field => table.addRow([{
          color: "blue",
          text: field.projectName,
        }, {
          color: "yellow",
          text: field.issueTypeName
        }, {
          text: field.fieldName
        }]));
        console.log(table.toString());
      });
  }

  static async listFields(jira) {
    return await jira.spin('Retrieving the fields...', jira.api.listFields());
  }

  static isSupported(fieldData) {
    if (["string", "number"].includes(fieldData.schema?.type)) {
      return true;
    }

    if ("allowedValues" in fieldData) {
      return true;
    }

    return false;
  }

  static fieldValue(field, fieldData) {
    if (!Field.isSupported(fieldData)) {
      return null;
    }

    let type;
    switch (fieldData.schema.type) {
      case 'number':
        return field;
      case 'string':
        return field;
    }

    if (Array.isArray(field)) {
      return field.map(f => this.fieldValue(f, fieldData)).join(", ");
    }

    return field.name;
  }

  static async fetchAndAskFieldIfSupported(jira, field, defaultValue = null) {
    const meta = await Project.metadata(jira, field.projectName, field.issueTypeName);
    const fields = meta.projects.find(p => p.key === field.projectName)
      .issuetypes.find(i => i.name === field.issueTypeName).fields;

    for (const name in fields) {
      const fieldObj = fields[name];
      if (fieldObj.name === field.fieldName) {
        return Field.askFieldIfSupported(fieldObj, defaultValue);
      }
    }

    return null;
  }

  static async askFieldIfSupported(fieldData, defaultValue = null) {
    if (!Field.isSupported(fieldData)) {
      console.log("Unsupported field");
      return null;
    }

    let type;
    switch (fieldData.schema.type) {
      case 'number':
        return {
          value: await Ask.askNumber(`${fieldData.name}:`), key: fieldData.key
        };
      case 'string':
        return {
          value: await Ask.askString(`${fieldData.name}:`), key: fieldData.key
        };

      case 'array':
        if (Array.isArray(defaultValue)) {
          defaultValue = defaultValue.map(a => ({
            id: a.id
          }));
        }

        const value = await Ask.askMultiList(`${fieldData.name}:`,
          fieldData.allowedValues.map(value => ({
            name: value.name,
            value: {
              id: value.id
            }
          })),
          defaultValue);

        return {
          key: fieldData.key,
            value: value,
        };
    }

    const value = await Ask.askList(`${fieldData.name}:`,
      fieldData.allowedValues.map(value => ({
        name: value.name,
        value: {
          id: value.id
        }
      })));

    return {
      key: fieldData.key,
      value,
    };
  }
};

export default Field;