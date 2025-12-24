import * as vscode from 'vscode';
import { MemoStore } from './data/memoStore';
import { MemoCodeLensProvider } from './codelens/memoCodeLens';
import { openMemo } from './commands/openMemo';
import { generateId } from './data/utils/id';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('codeMemo.createMemo', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;

			const file = editor.document.uri.fsPath;
			const line = editor.selection.active.line + 1;

			const note = await vscode.window.showInputBox({
				prompt: 'Enter path to memo file (e.g. docs/auth.md)',
			});

			if (!note) return;

			MemoStore.add({
				id: generateId(),
				code: { file, line },
				note: { file: note },
				createdAt: new Date().toISOString(),
			});

			vscode.window.showInformationMessage('Memo link created.');
		}),

		vscode.commands.registerCommand('codeMemo.openMemo', openMemo),

		vscode.languages.registerCodeLensProvider('*', new MemoCodeLensProvider())
	);
}

export function deactivate() { }
