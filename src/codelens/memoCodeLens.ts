import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MemoStore } from '../data/memoStore';
import { normalizePath } from '../utils/paths';

export class MemoCodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const lenses: vscode.CodeLens[] = [];
        const links = MemoStore.load().links;
        const docPath = normalizePath(document.uri);
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        for (const link of links) {
            if (normalizePath(link.code.file) === docPath) {
                const line = link.code.line - 1;
                const range = new vscode.Range(line, 0, line, 0);
                const label = path.basename(link.note.file);

                let preview = '';
                if (root) {
                    const abs = path.join(root, link.note.file);
                    if (fs.existsSync(abs)) {
                        preview = fs.readFileSync(abs, 'utf8').split('\n').slice(0, 6).join('\n');
                    }
                }

                lenses.push(
                    new vscode.CodeLens(range, {
                        title: `$(note) ${label}`,
                        tooltip: preview ? `Memo preview:\n${preview}` : 'Open linked memo',
                        command: 'codeMemo.openMemo',
                        arguments: [link.note.file],
                    })
                );
            }
        }

        return lenses;
    }
}
