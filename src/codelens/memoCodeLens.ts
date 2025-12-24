import * as vscode from 'vscode';
import { MemoStore } from '../data/memoStore';

export class MemoCodeLensProvider implements vscode.CodeLensProvider {
    onDidChangeCodeLenses?: vscode.Event<void> | undefined;

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const lenses: vscode.CodeLens[] = [];
        const links = MemoStore.load().links;

        for (const link of links) {
            if (document.uri.fsPath === link.code.file) {
                const line = link.code.line - 1;
                const range = new vscode.Range(line, 0, line, 0);

                lenses.push(
                    new vscode.CodeLens(range, {
                        title: `Referenced by: ${link.note.file}`,
                        command: 'codeMemo.openMemo',
                        arguments: [link.note.file],
                    })
                );
            }
        }

        return lenses;
    }
}
