English | [Русский](obsidian-import.ru.md)

# Import from Obsidian

Select **Импорт из Obsidian** in the sidebar. Upload the vault folder or a regular ZIP backup containing Markdown files; Obsidian has no SQL dump requirement for this workflow.

1. Choose a folder or ZIP. Nothing is selected initially. Hidden configuration folders and attachments are ignored.
2. Expand the tree and select categories or individual notes. A category checkbox selects its entire subtree. **Только эта ветка** lets you focus on a branch; its folder becomes the root category of the import. Navigation resets selection.
3. Select a destination in RepeatMe. Parent categories needed by selected notes are created automatically.
4. Check the vault name for `obsidian://` links. If you uploaded only a subfolder, specify the actual vault name and that subfolder's path relative to the vault. For a full vault, leave the prefix empty.
5. Enable text import only if you want selected Markdown content copied into the card material. By default, only names, hierarchy, and source links are imported. New cards have no generated review questions.
6. Click **Импортировать выбранное** and review the counts of created and skipped records.

An existing source link, or a matching title in the destination category, causes a note to be skipped. Existing criteria, material, links, schedules, and history are preserved. Import adds records; it does not synchronize, delete, or rename existing cards, and it never writes to the vault.

Limits: 1,000 Markdown notes per source, 1,000 categories per request, 50 MB ZIP size. When importing text, selected files may total at most 1 MB and each note at most 100,000 characters. ZIP names are inspected before any note text is decompressed. Only selected content is read or sent to the backend. The folder picker cannot report completely empty directories; ZIP directory entries can include them.

`POST /api/imports/obsidian` accepts `{ vaultName, vaultPrefix?, basePath?, parentId?, folders: string[], notes: [{ path, content? }] }`. Paths are relative to the uploaded source. `basePath` is the focused branch; its parent hierarchy is omitted from categories while source links retain the original path. Writes use one transaction and the same structure lock as normal edits.

The official, unmodified Obsidian mark is used to identify this import action. [Obsidian brand assets and guidelines](https://obsidian.md/brand).
