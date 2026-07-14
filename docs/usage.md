# Using doc-viewer

## Adding documents

Drag one or more `.md` files anywhere onto the window. A drop overlay appears; on release each file shows an upload card in the corner. Files land in the root of the archive. Anything that is not a `.md` file is rejected with a note.

You can also copy files straight into the `archive/` folder on disk and press "Sync archive now" in Settings -> General (or restart the app).

## Reading

Click a document in the sidebar tree to open it. Documents render with GitHub-flavoured markdown: tables, task lists, strikethrough, and syntax-highlighted code blocks. The title shown in the tree is the document's first `# heading`, falling back to the filename.

The Expand button in the toolbar widens the reading area to the full window, which helps with wide tables and code blocks. The choice is remembered across documents and sessions; Collapse returns to the fixed reading width.

## Organising

- **Folders**: "+ New folder" at the bottom of the tree creates a root folder. The row menu (⋯) on a folder offers "New folder inside", "Rename", and "Delete". Folders are real directories inside `archive/`.
- **Rename / delete documents**: the row menu on a document, or the toolbar of an open document.
- **Missing files**: if a file disappears from the archive, its entry stays greyed out with a strikethrough. Restore the file and sync, or prune missing entries in Settings -> General.

## Tags

Create tags in Settings -> Tags: pick a name and a colour. Apply them from the "+ Tag" button in a document's toolbar. Tag dots appear next to documents in the tree. Renaming or recolouring a tag updates it everywhere; deleting it removes it from all documents.

## Themes

Settings -> Appearance offers Light, Dark, and System. The choice is saved server-side and applies to the whole app, including document rendering.

## Exporting

Open a document and use the HTML or PDF buttons in the toolbar. Exports use the theme active at that moment:

- **HTML**: a single self-contained file with all styling inlined
- **PDF**: printed via Chromium with backgrounds, A4 with margins

The same conversions are available from the command line; see [cli.md](cli.md).
