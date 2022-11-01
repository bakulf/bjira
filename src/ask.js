// SPDX-FileCopyrightText: 2021-2022 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import inquirerCheckboxPlusPrompt from 'inquirer-checkbox-plus-prompt';
import fuzzy from 'fuzzy';

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);
inquirer.registerPrompt('checkbox-plus', inquirerCheckboxPlusPrompt);

class Ask {
  static async askString(message, defaultValue = undefined) {
    const question = {
      type: 'input',
      name: 'value',
      message,
    };

    if (defaultValue !== undefined) question.default = defaultValue;
    const answer = await inquirer.prompt([question]);
    return answer.value;
  }

  static async askPassword(message) {
    const answer = await inquirer.prompt([{
      type: 'password',
      name: 'value',
      message,
    }]);
    return answer.value;
  }

  static async askBoolean(message) {
    const answer = await inquirer.prompt([{
      type: 'confirm',
      name: 'value',
      message,
    }]);
    return answer.value;
  }

  static async askNumber(message) {
    const question = {
      type: 'number',
      name: 'value',
      message,
    };

    const answer = await inquirer.prompt([question]);
    return answer.value;
  }

  static async askList(message, list) {
    const answer = await inquirer.prompt([{
      type: 'autocomplete',
      name: 'value',
      message,
      source: (answers, input) => fuzzy.filter(input || '', list, {
        extract: el => el.name
      }).map(el => el.original),
    }]);
    return answer.value;
  }

  static async askCallback(message, callback) {
    const answer = await inquirer.prompt([{
      type: 'autocomplete',
      name: 'value',
      message,
      source: (answers, input) => callback(input),
    }]);
    return answer.value;
  }

  static async askMultiList(message, list, defaultValue = null) {
    const answer = await inquirer.prompt([{
      type: 'checkbox-plus',
      name: 'value',
      message,
      default: defaultValue,
      searchable: true,
      source: (answers, input) => {
        return new Promise(resolve => {
          resolve(fuzzy.filter(input || '', list, {
            extract: el => el.name
          }).map(element => element.original));
        });
      },
    }]);
    return answer.value;
  }

};

export default Ask;