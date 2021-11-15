import inquirer from 'inquirer';

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
      type: 'list',
      name: 'value',
      message,
      choices: list,
      filter: name => list.indexOf(name),
    }]);
    return answer.value;
  }
};

export default Ask;