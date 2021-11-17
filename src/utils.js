// SPDX-FileCopyrightText: 2021 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import execa from 'execa';
import fs from 'fs';
import temp from 'temp';

class Utils {
  static async writeInTempFile() {
    temp.track();

    let file;
    try {
      file = temp.openSync('jira');
    } catch (e) {
      console.log("Failed to open a temporary file");
      return null;
    }

    const code = await new Promise(resolve => {
      const subprocess = execa(process.env.EDITOR, [file.path], {
        detached: true,
        stdio: 'inherit',
      });

      subprocess.on('error', () => resolve(-1));
      subprocess.on('close', resolve);
    });

    if (code !== 0) {
      console.log("Failed to run the app");
      return null;
    }

    let value = fs.readFileSync(file.path);
    return value.toString().trim();
  }
};

export default Utils;