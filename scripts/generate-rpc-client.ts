#!/usr/bin/env -S npx -y tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

import {type MethodObject} from '@open-rpc/meta-schema';
import {parseOpenRPCDocument} from '@open-rpc/schema-utils-js';
import OpenRPCTypings from '@open-rpc/typings';

function buildTree(methods: MethodObject[]): any {
  const tree: any = {};
  for (const method of methods) {
    let node = tree;
    for (const part of method.name.split('.')) {
      if (!node[part]) {
        node[part] = {};
      }
      node = node[part];
    }
    node.__method = method;
  }
  return tree;
}

type MethodTypings = Record<string, {params: string; result: string}>;
function extractMethodTypings(methods: MethodObject[], typings: OpenRPCTypings): MethodTypings {
  const regex = /export type (\S+) = \((.*)\) => (.+);/;
  const typeMap = Object.fromEntries(
    methods.map((method) => [typings.getTypingNames('typescript', method).method, method.name]),
  );
  return Object.fromEntries(
    typings
      .getMethodTypings('typescript')
      .split('\n')
      .map((line) => {
        const match = line.match(regex);
        if (!match) throw new Error(`Unexpected method typing: ${line}`);
        const [, method, params, result] = match;
        return [typeMap[method], {params, result}];
      }),
  );
}

function buildObject(node: any, methodTypings: MethodTypings, topLevel = false): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries<any>(node)) {
    if (key === '__method') continue;

    const prefix = key + (topLevel ? ' = ' : ': ');
    const suffix = topLevel ? ';' : ',';

    const method = value.__method as MethodObject;
    if (method) {
      const summary = ['/**', `* ${method.summary}`, '*/'];
      const types = methodTypings[method.name];
      const call =
        method.params.length === 0
          ? `async (): ${types.result} => this.call('${method.name}')`
          : method.paramStructure === 'by-name'
          ? `async (args: {${types.params}}): ${types.result} => this.call('${method.name}', args)`
          : `async (...args: [${types.params}]): ${types.result} => this.call('${method.name}', args)`;
      if (Object.keys(value).length > 1) {
        // both callable and nested → Object.assign
        const nested = buildObject(value, methodTypings);
        lines.push(...summary, prefix + `Object.assign(${call}, {`, ...nested, '})' + suffix);
      } else {
        // plain leaf function
        lines.push(...summary, prefix + call + suffix);
      }
    } else {
      // nested object only
      const nested = buildObject(value, methodTypings);
      lines.push(prefix + `{`, ...nested, '}' + suffix);
    }
  }

  return lines.map((line) => '  ' + line);
}

async function generate(filename: string) {
  try {
    const doc = await parseOpenRPCDocument(filename);
    const methods = doc.methods as MethodObject[];
    const tree = buildTree(methods);
    const typings = new OpenRPCTypings(doc);
    const methodTypings = extractMethodTypings(methods, typings);

    const output = `// GENERATED FILE, DO NOT EDIT!!!
/* eslint-disable @typescript-eslint/no-explicit-any */

import OpenMowerBaseRpc from './rpc-base';

${typings.getSchemaTypings('typescript')}

export class OpenMowerRpc extends OpenMowerBaseRpc {
${buildObject(tree, methodTypings, true).join('\n')}
}
`;
    process.stdout.write(output);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

const filename = process.argv[2];
if (!filename) {
  console.error('Usage: generate-rpc-client.ts <filename>');
  process.exit(1);
}

generate(filename);
