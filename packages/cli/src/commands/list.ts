import { ArchiveStore } from '@doc-viewer/core';
import type { Command } from 'commander';
import { resolve } from 'node:path';

export function registerListCommand(program: Command): void
{
  program
    .command('list')
    .description('List markdown files in the archive folder')
    .option('--archive <dir>', 'archive directory', 'archive')
    .action((options: { archive: string }) =>
    {
      const archive = new ArchiveStore(resolve(options.archive));
      const files = archive.scan();
      if (files.length === 0)
      {
        console.log('No markdown files found.');
        return;
      }
      for (const file of files)
      {
        console.log(file);
      }
    });
}
