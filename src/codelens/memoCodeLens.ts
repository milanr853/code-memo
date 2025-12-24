import * as vscode from 'vscode';
import { MemoStore } from '../data/memoStore';
import { normalizePath } from '../utils/paths';

export class MemoCodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const lenses: vscode.CodeLens[] = [];
        const links = MemoStore.load().links;
        const docPath = normalizePath(document.uri);

        console.log('[Code-Memo] scanning', docPath);

        for (const link of links) {
            if (docPath === link.code.file) {
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
