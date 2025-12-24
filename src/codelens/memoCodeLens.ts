import * as vscode from 'vscode';
import * as path from 'path';
import { MemoStore } from '../data/memoStore';
import { normalizePath } from '../utils/paths';

export class MemoCodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const lenses: vscode.CodeLens[] = [];
        const links = MemoStore.load().links;
        const docPath = normalizePath(document.uri);

        for (const link of links) {
            if (normalizePath(link.code.file) === docPath) {
                const line = link.code.line - 1;
                const range = new vscode.Range(line, 0, line, 0);
                const label = path.basename(link.note.file);

                lenses.push(
                    new vscode.CodeLens(range, {
                        title: `$(note) ${label}`,
                        tooltip: `Open memo: ${link.note.file}`,
                        command: 'codeMemo.openMemo',
                        arguments: [link.note.file],
                    })
                );
            }
        }

        return lenses;
    }
}
