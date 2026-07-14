import { DocStore } from '@doc-viewer/core';
import type { Command } from 'commander';
import { join, resolve } from 'node:path';

export function registerSyncCommand(program: Command): void
{
  program
    .command('sync')
    .description('Reconcile the archive folder with the metadata database')
    .option('--archive <dir>', 'archive directory', 'archive')
    .option('--data <dir>', 'data directory holding the database', 'data')
    .action((options: { archive: string; data: string }) =>
    {
      const store = new DocStore({
        archiveDir: resolve(options.archive),
        dbPath: join(resolve(options.data), 'doc-viewer.db')
      });
      try
      {
        const result = store.sync();
        console.log(
          `Added ${result.added}, restored ${result.restored}, marked missing ${result.markedMissing}`
        );
      }
      finally
      {
        store.close();
      }
    });
}
