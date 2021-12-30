// SPDX-FileCopyrightText: 2021-2022 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import Jira from './jira.js';

class User {
  static async pickUser(jira) {
    const currentUser = await jira.spin('Retrieving current user...', jira.api.getCurrentUser());
    const userList = await jira.spin('Retrieving users...', jira.api.getUsers(0, 1000));
    return User.sortUsers(currentUser, userList);
  }

  static sortUsers(currentUser, userList) {
    userList.sort((a, b) => {
      if (a.accountId === currentUser.accountId) {
        return -1;
      }

      if (b.accountId === currentUser.accountId) {
        return 1;
      }

      if (a.displayName < b.displayName) {
        return -1;
      }

      if (a.displayName > b.displayName) {
        return 1;
      }

      return 0;
    });

    return userList;
  }
};

export default User;