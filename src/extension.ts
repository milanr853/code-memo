import * as vscode from 'vscode';
import { MemoStore } from './data/memoStore';
import { MemoCodeLensProvider } from './codelens/memoCodeLens';
import { openMemo } from './commands/openMemo';
import { generateId } from './utils/id';
import { registerRenameWatcher } from './watchers/renameWatcher';
import { normalizePath } from './utils/paths';
import { reconcileMemos } from './reconcile';
import { registerFsWatcher } from './watchers/fsWatcher';
import { MemoTreeProvider } from './views/memoTree';

export function activate(context: vscode.ExtensionContext) {
	console.log('[Code-Memo] activated');

	reconcileMemos().catch(console.error);
	registerFsWatcher(context);

	vscode.window.onDidChangeWindowState(e => {
		if (e.focused) reconcileMemos().catch(console.error);
	});

	vscode.workspace.onDidOpenTextDocument(() => {
		reconcileMemos().catch(console.error);
	});

	MemoStore.cleanupMissingFiles();
	registerRenameWatcher(context);

	vscode.window.registerTreeDataProvider('codeMemoView', new MemoTreeProvider());

	context.subscriptions.push(
		vscode.commands.registerCommand('codeMemo.createMemo', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;

			const file = normalizePath(editor.document.uri);
			const line = editor.selection.active.line + 1;

			const data = MemoStore.load();
			const picks = data.links.map(l => l.note.file);
			const unique = [...new Set(picks), 'Create new memo...'];

			let memoPath = await vscode.window.showQuickPick(unique, {
				placeHolder: 'Select or create a memo',
			});

			if (!memoPath || memoPath === 'Create new memo...') {
				memoPath = await vscode.window.showInputBox({
					prompt: 'Enter new memo path (e.g. docs/new.md)',
				});
			}

			if (!memoPath) return;

			MemoStore.upsert({
				id: generateId(),
				code: { file, line },
				note: { file: normalizePath(memoPath) },
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
