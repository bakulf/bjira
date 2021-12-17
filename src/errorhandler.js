// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import Table from './table.js';

class ErrorHandler {
  static showError(jira, e) {
    const table = new Table({
      head: ['Errors']
    });

    if (typeof e.error === "string") {
      table.addRow([{
        color: "blue",
        text: e.error
      }]);
    } else if ("errorMessages" in e.error) {
      e.error.errorMessages.forEach(error => table.addRow([{
        color: "blue",
        text: error
      }]));
    } else if ("message" in e.error) {
      table.addRow([{
        color: "blue",
        text: e.error.message
      }]);
    } else {
      table.addRow([{
        color: "blue",
        text: e.error
      }]);
    }

    console.log(table.toString());
  }

  static showWarningMessages(jira, messages) {
    const table = new Table({
      head: ['Warnings']
    });

    messages.forEach(warning => table.addRow([{
      color: "blue",
      text: warning
    }]));
    console.log(table.toString());
  }
};

export default ErrorHandler;