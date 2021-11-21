// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import fuzzy from 'fuzzy';

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

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
      source: (answers, input) => fuzzy.filter(input || '', list).map(el => el.original),
      filter: choice => list.indexOf(choice),
    }]);
    return answer.value;
  }
};

export default Ask;