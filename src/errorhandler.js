import color from 'chalk';

import Table from './table.js';

class ErrorHandler {
  static showError(jira, e) {
    const table = new Table({
      head: ['Errors']
    });

    e.error.errorMessages.forEach(error => table.addRow([color.blue(error)]));
    console.log(table.toString());
  }

  static showWarningMessages(jira, messages) {
    const table = new Table({
      head: ['Warnings']
    });

    messages.forEach(warning => table.addRow([color.blue(warning)]));
    console.log(table.toString());
  }
};

export default ErrorHandler;