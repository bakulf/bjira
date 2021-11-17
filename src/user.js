// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import Jira from './jira.js';

class User {
  static async pickUser(jira) {
    const currentUser = await jira.spin('Retrieving current user...', jira.api.getCurrentUser());
    const userList = await jira.spin('Retrieving users...', jira.api.getUsers(0, 1000));

    userList.sort((a, b) => {
      if (a.accountId === currentUser.accountId) {
        return -1;
      }

      if (b.accountId === currentUser.accountId) {
        return 1;
      }

      return a.displayName > b.displayName;
    });

    return userList;
  }
};

export default User;