# CLI reference

The CLI wraps the same core engine the web app uses, so conversions are identical. Inside the repo run it as `node packages/cli/dist/index.js` (after `pnpm build`).

## doc-viewer convert

Convert markdown files to themed HTML or PDF.

```
doc-viewer convert <files...> --to <html|pdf> [--theme <light|dark>] [-o <dir>]
```

| Option | Description | Default |
| ------ | ----------- | ------- |
| `-t, --to` | Output format: `html` or `pdf` (required) | |
| `--theme` | `light` or `dark` | `light` |
| `-o, --out` | Output directory | next to each source file |

Examples:

```bash
doc-viewer convert README.md --to html --theme dark
doc-viewer convert notes/*.md --to pdf -o exports/
```

HTML output is a single self-contained file. PDF output requires a Chromium install once: `pnpm exec playwright install chromium`.

## doc-viewer list

List every markdown file found in an archive folder.

```
doc-viewer list [--archive <dir>]     # default: ./archive
```

## doc-viewer sync

Reconcile an archive folder with the metadata database, exactly like the server does at startup: new files are indexed, vanished files are flagged missing, returned files are restored.

```
doc-viewer sync [--archive <dir>] [--data <dir>]   # defaults: ./archive, ./data
```

Prints a summary such as `Added 2, restored 0, marked missing 1`.
