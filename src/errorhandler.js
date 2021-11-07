import color from 'chalk';
import Table from 'cli-table3';

class ErrorHandler {
  static showError(jira, e) {
    const table = new Table({
      chars: jira.tableChars,
      head: ['Errors']
    });

    e.error.errorMessages.forEach(error => table.push([color.blue(error)]));
    console.log(table.toString());
  }

  static showWarningMessages(jira, messages) {
    const table = new Table({
      chars: jira.tableChars,
      head: ['Warnings']
    });

    messages.forEach(warning => table.push([color.blue(warning)]));
    console.log(table.toString());
  }
};

export default ErrorHandler;