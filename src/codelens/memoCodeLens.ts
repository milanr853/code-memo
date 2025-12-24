import * as vscode from 'vscode';
import * as path from 'path';
import { MemoStore } from '../data/memoStore';
import { normalizePath } from '../utils/paths';

export class MemoCodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const lenses: vscode.CodeLens[] = [];
        const links = MemoStore.load().links;
        const docPath = normalizePath(document.uri);

        const grouped = new Map<number, typeof links>();

        for (const link of links) {
            if (normalizePath(link.code.file) === docPath) {
                const arr = grouped.get(link.code.line) || [];
                arr.push(link);
                grouped.set(link.code.line, arr);
            }
        }

        for (const [line, group] of grouped) {
            const range = new vscode.Range(line - 1, 0, line - 1, 0);
            const names = group.map(l => path.basename(l.note.file));
            const title = `Referred by: ${names.join(', ')}`;

            lenses.push(
                new vscode.CodeLens(range, {
                    title,
                    tooltip: 'Click to open memo',
                    command: 'codeMemo.openMemoPicker',
                    arguments: [docPath, line],
                })
            );
        }

        return lenses;
    }

    private _onDidChange = new vscode.EventEmitter<void>();
    onDidChangeCodeLenses = this._onDidChange.event;

    refresh() {
        this._onDidChange.fire();
    }
}
