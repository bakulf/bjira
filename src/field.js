// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import Ask from './ask.js';
import Command from './command.js';
import Jira from './jira.js';
import Table from './table.js';

class Field extends Command {
  addOptions(program) {
    const cmd = program.command("field")
      .description("Do things related to issue fields")
    cmd.command("listall")
      .description("Show the list of fields")
      .action(async () => {
        const jira = new Jira(program);

        const resultFields = await Field.listFields(jira);

        const table = new Table({
          head: ['Name', 'Supported', 'Type']
        });

        resultFields.forEach(field => {
          const supported = Field.isSupported(field.schema?.type);
          table.addRow([{
            color: "blue",
            text: field.name
          }, supported, supported ? field.schema?.type : ""]);
        });
        console.log(table.toString());
      });

    cmd.command("add")
      .description("Add a custom field to be shown")
      .argument('<field>', 'The field name')
      .action(async fieldName => {
        const jira = new Jira(program);

        const resultFields = await Field.listFields(jira);

        const fieldData = resultFields.find(field => field.name === fieldName);
        if (!fieldData) {
          console.log("Unknown field.");
          return;
        }

        if (!Field.isSupported(fieldData.schema?.type)) {
          console.log("Unsupported field.");
          return;
        }

        jira.addField(fieldName);
        jira.syncConfig();

        console.log('Config file succesfully updated');
      });

    cmd.command("remove")
      .description("Remove a custom field")
      .argument('<field>', 'The field name')
      .action(async fieldName => {
        const jira = new Jira(program);

        if (!jira.fields.includes(fieldName)) {
          console.log("Unknown field.");
          return;
        }

        jira.removeField(fieldName);
        jira.syncConfig();

        console.log('Config file succesfully updated');
      });

    cmd.command("list")
      .description("List the supported custom field")
      .action(async () => {
        const jira = new Jira(program);

        const table = new Table({
          head: ['Name']
        });

        jira.fields.forEach(fieldName => table.addRow([{
          color: "blue",
          text: fieldName
        }]));
        console.log(table.toString());
      });
  }

  static async listFields(jira) {
    return await jira.spin('Retrieving the fields...', jira.api.listFields());
  }

  static isSupported(fieldType) {
    return ["string", "number"].includes(fieldType);
  }

  static async askFieldIfSupported(jira, fieldName) {
    const resultFields = await Field.listFields(jira);

    let fieldData;
    resultFields.forEach(field => {
      if (field.name === fieldName) fieldData = field;
    });

    if (!fieldData) {
      console.log(`Unable to find the field "${fieldName}"`);
      return null;
    }

    if (!Field.isSupported(fieldData.schema?.type)) {
      console.log("Unsupported field");
      return null;
    }

    let type;
    switch (fieldData.schema.type) {
      case 'number':
        return {
          value: await Ask.askNumber(`${fieldName}:`), key: fieldData.key
        };
      case 'string':
        return {
          value: await Ask.askString(`${fieldName}:`), key: fieldData.key
        };
    }

    return null;
  }
};

export default Field;