import * as vscode from 'vscode';
import { MemoStore } from './data/memoStore';
import { MemoCodeLensProvider } from './codelens/memoCodeLens';
import { openMemo } from './commands/openMemo';
import { generateId } from './utils/id';
import { registerRenameWatcher } from './watchers/renameWatcher';
import { normalizePath } from './utils/paths';
import { reconcileMemos } from './reconcile';

export function activate(context: vscode.ExtensionContext) {
	console.log('[Code-Memo] activated');

	// Heal links on startup (handles renames done outside VS Code)
	reconcileMemos().catch(console.error);


	// Remove links pointing to missing files
	MemoStore.cleanupMissingFiles();

	// Listen for in-editor renames
	registerRenameWatcher(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeMemo.createMemo', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;

			const file = normalizePath(editor.document.uri);
			const line = editor.selection.active.line + 1;

			const note = await vscode.window.showInputBox({
				prompt: 'Enter path to memo file (e.g. docs/token.md)',
			});

			if (!note) return;

			MemoStore.upsert({
				id: generateId(),
				code: { file, line },
				note: { file: normalizePath(note) },
				createdAt: new Date().toISOString(),
			});

			vscode.window.showInformationMessage('Memo link created.');
		}),

		vscode.commands.registerCommand('codeMemo.openMemo', openMemo),

		vscode.languages.registerCodeLensProvider(
			{ scheme: 'file' },
			new MemoCodeLensProvider()
		)
	);
}

export function deactivate() { }
