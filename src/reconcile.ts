import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MemoStore } from './data/memoStore';

export async function reconcileMemos() {
    const data = MemoStore.load();
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root || data.links.length === 0) return;

    const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');

    let changed = false;

    for (const link of data.links) {
        const codeCandidates = files.filter(f => f.fsPath.endsWith(path.basename(link.code.file)));
        for (const f of codeCandidates) {
            const rel = vscode.workspace.asRelativePath(f);
            if (rel !== link.code.file) {
                link.code.file = rel;
                changed = true;
            }
        }

        const noteCandidates = files.filter(f => f.fsPath.endsWith(path.basename(link.note.file)));
        for (const f of noteCandidates) {
            const rel = vscode.workspace.asRelativePath(f);
            if (rel !== link.note.file) {
                link.note.file = rel;
                changed = true;
            }
        }
    }

    if (changed) MemoStore.save(data);
}
