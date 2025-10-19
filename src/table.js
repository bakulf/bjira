// SPDX-FileCopyrightText: 2021-2022 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT

import color from 'chalk';

class Table {
  constructor(options) {
    this._columns = [];
    this._rows = 0;

    options.head?.forEach(head => {
      this._columns.push(this._createColumn(head, 0));
    });

    this._unresizableColumns = options.unresizableColumns || [];
  }

  addRow(row) {
    while (this._columns.length < row.length) {
      this._columns.push(this._createColumn(undefined, this._rows));
    }

    row.forEach((field, pos) => {
      if (typeof field !== "object") field = {
        text: field
      };
      field.text = ("" + (field.text === undefined ? "" : field.text)).split("\n");
      this._columns[pos].rows.push(field);
    });

    for (let i = row.length; i < this._columns.length; ++i) {
      this._columns[i].rows.push({
        text: [""]
      });
    }

    ++this._rows;
  }

  addRows(rows) {
    rows.forEach(row => this.addRow(row));
  }

  toString() {
    if (!this._columns.length) {
      return "";
    }

    this._columns.forEach(column => this._computeColumnWidth(column));

    const totalWidth = this._columns.reduce((x, column) => x + column.width, this._columns.length - 1);
    const availableColumns = (process.stdout && process.stdout.columns) ? process.stdout.columns : 120;
    if (totalWidth > availableColumns) {
      this._resizeWidthOf(totalWidth - availableColumns + (this._columns.length - 1));
    }

    const lines = [];

    if (this._columns.find(column => !!column.head)) {
      lines.push(this._columns.map((column, pos, array) => (color.red(this._toWidth(column.head || "", column.width, pos < array.length - 1)))).join(" "));
    }

    for (let row = 0; row < this._rows; ++row) {
      const rowHeight = Math.max(...this._columns.map(column => this._computeRowHeight(column, row)));

      for (let i = 0; i < rowHeight; ++i) {
        lines.push(this._columns.map((column, pos, array) => this._stylize(column.rows[row], this._toWidth(this._computeLine(column.rows[row], i), column.width, pos < array.length - 1))).join(" "));
      }
    }

    return lines.join("\n");
  }

  _createColumn(head, rows) {
    return {
      head,
      rows: new Array(rows),
      width: 0
    }
  }

  _computeColumnWidth(column) {
    column.width = Math.max(...column.rows.map(row =>
      Math.max(...row.text.map(line => line.length))
    ));

    if (column.head) column.width = Math.max(column.width, column.head.length);
  }

  _computeRowHeight(column, row) {
    return column.rows[row].text.length;
  }

  _toWidth(str, width, spaces) {
    str = str || "";

    let strLength = str.length;
    if (strLength > width) {
      return this._truncate(str, width - 1) + "…";
    }

    if (spaces) {
      for (let strLength = str.length; strLength < width; ++strLength) str += " ";
    }
    return str;
  }

  _computeLine(row, subRow) {
    return row.text.length < subRow ? "" : row.text[subRow];
  }

  _resizeWidthOf(size) {
    for (; size > 0; --size) {
      this._resizeWidthOfOne();
    }

    this._columns.forEach(column => {
      column.rows.forEach((row, pos) => {
        let lines = [];
        row.text.forEach(line => {
          lines = lines.concat(this._maybeSplitRow(line, column.width));
        });
        column.rows[pos].text = lines;
      });
    });
  }

  _maybeSplitRow(row, width) {
    if (row.length <= width) return [row];

    const rows = [];
    let currentRow = "";
    for (let part of row.split(" ")) {
      if (currentRow.length === 0) {
        currentRow = part;
      } else if ((currentRow.length + part.length + 1) < width) {
        currentRow += " " + part;
      } else {
        rows.push(currentRow);
        currentRow = part;
      }
    }

    if (currentRow.length !== 0) {
      rows.push(currentRow);
    }

    return rows;
  }

  _resizeWidthOfOne() {
    const max = Math.max(...this._columns.map(column => column.width));
    for (let i = 0; i < this._columns.length; ++i) {
      const column = this._columns[i];
      if (!this._unresizableColumns.includes(i) && column.width === max) {
        --column.width;
        break;
      }
    }
  }

  _truncate(str, width) {
    return str.slice(0, width);
  }

  _stylize(row, text) {
    if (!("style" in row) || row.style === "normal") {
      return this._colorize(row, text);
    }

    return color[row.style].apply(null, [this._colorize(row, text)]);
  }

  _colorize(row, text) {
    if (!("color" in row)) {
      return text;
    }

    return color[row.color].apply(null, [text]);
  }
};

export default Table;