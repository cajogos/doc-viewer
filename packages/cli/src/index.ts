#!/usr/bin/env node
import { Command } from 'commander';
import { registerConvertCommand } from './commands/convert.js';
import { registerListCommand } from './commands/list.js';
import { registerSyncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('doc-viewer')
  .description('CLI for doc-viewer: convert markdown and manage the archive')
  .version('0.1.0');

registerConvertCommand(program);
registerListCommand(program);
registerSyncCommand(program);

program.parseAsync(process.argv).catch((error: Error) =>
{
  console.error(error.message);
  process.exit(1);
});
