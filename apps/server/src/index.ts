import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';

const here = dirname(fileURLToPath(import.meta.url));

const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 8090);
const archiveDir = process.env.ARCHIVE_DIR ?? resolve(process.cwd(), 'archive');
const dataDir = process.env.DATA_DIR ?? resolve(process.cwd(), 'data');
const webDistDir = process.env.WEB_DIST ?? resolve(here, '../../web/dist');

const app = buildApp({
  archiveDir,
  dbPath: resolve(dataDir, 'doc-viewer.db'),
  webDistDir,
  logger: true
});

try
{
  await app.listen({ host, port });
}
catch (error)
{
  app.log.error(error);
  process.exit(1);
}
