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
import { hashFile } from './utils/hash';
import * as path from 'path';

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

			const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			if (!root) return;

			const rel = memoPath.replace(/^\.?\//, '');
			const abs = path.join(root, rel);
			const hash = hashFile(abs);

			const normalizedMemo = normalizePath(memoPath);

			// ❌ Prevent self-link
			if (normalizedMemo === file) {
				vscode.window.showErrorMessage('A file cannot be linked to itself.');
				return;
			}
			MemoStore.upsert({
				id: generateId(),
				code: { file, line },
				note: {
					file: normalizedMemo,
					hash
				},
				createdAt: new Date().toISOString(),
			});


			vscode.window.showInformationMessage('Memo link created.');
		}),

		vscode.commands.registerCommand('codeMemo.openMemo', openMemo),

		vscode.commands.registerCommand('codeMemo.openMemoPicker', async (file: string, line: number) => {
			const data = MemoStore.load();
			const targets = data.links.filter(l => l.code.file === file && l.code.line === line);

			if (targets.length === 0) return;

			const pick = await vscode.window.showQuickPick(
				targets.map(l => ({
					label: path.basename(l.note.file),
					description: l.note.file,
					link: l,
				})),
				{ placeHolder: 'Select memo to open' }
			);

			if (!pick) return;

			openMemo(pick.link.note.file);
		}),

		vscode.commands.registerCommand('codeMemo.removeMemo', async () => {
			const editor = vscode.window.activeTextEditor;
			const data = MemoStore.load();

			if (data.links.length === 0) {
				vscode.window.showInformationMessage('No memo links exist.');
				return;
			}

			const activeFile = editor ? normalizePath(editor.document.uri) : null;

			const candidates = activeFile
				? data.links.filter(l => l.code.file === activeFile)
				: data.links;

			if (candidates.length === 0) {
				vscode.window.showInformationMessage('No memos exist for this file.');
				return;
			}

			const pick = await vscode.window.showQuickPick(
				candidates.map(l => ({
					label: path.basename(l.note.file),
					description: `${l.code.file}:${l.code.line}`,
					link: l,
				})),
				{ placeHolder: activeFile ? 'Select memo to remove from this file' : 'Select memo to remove' }
			);

			if (!pick) return;

			MemoStore.remove(pick.link);
			vscode.window.showInformationMessage(`Removed memo: ${pick.label}`);
		}),

		vscode.languages.registerCodeLensProvider(
			{ scheme: 'file' },
			new MemoCodeLensProvider()
		)
	);
}

export function deactivate() { }
