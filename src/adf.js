// SPDX-FileCopyrightText: 2021-2026 Andrea Marchesini <baku@bnode.dev>
//
// SPDX-License-Identifier: MIT
// Implements the Atlassian Document Format (ADF) helper.

class ADF {
  static create(text) {
    return {
      content: [{
        content: [{
          text,
          "type": "text"
        }],
        type: "paragraph"
      }],
      type: "doc",
      version: 1
    }
  }

  static show(obj) {
    if (typeof obj === "string") return obj;

    switch (obj.type) {
      case 'doc':
      case 'paragraph':
        return obj.content.map(a => ADF.show(a)).join("");

      case 'text':
        return obj.text;

      case 'inlineCard':
        return obj.attrs.url;

      case 'status':
      case 'mention':
      case 'emoji':
        return obj.attrs.text;

      case 'hardBreak':
        return '\n';

      case 'date':
        const date = new Date(obj.attrs.timestamp * 1000);
        return date.toLocaleString();

      default:
        return '';
    }
  }
}

export default ADF;