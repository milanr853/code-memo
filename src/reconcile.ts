import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MemoStore } from './data/memoStore';

export async function reconcileMemos() {
    const data = MemoStore.load();
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root || data.links.length === 0) return;

    const files = await vscode.workspace.findFiles(
        '**/*',
        '{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/.vscode/**}'
    );

    let changed = false;

    for (const link of data.links) {

        // ---- CODE FILE ----
        const codeAbs = path.join(root, link.code.file);
        if (!fs.existsSync(codeAbs)) {
            const basename = path.basename(link.code.file);
            const matches = files.filter(f => path.basename(f.fsPath) === basename);

            if (matches.length === 1) {
                const newRel = vscode.workspace.asRelativePath(matches[0]);
                console.log('[Code-Memo] healed code path:', link.code.file, '→', newRel);
                link.code.file = newRel;
                changed = true;
            }
        }

        // ---- NOTE FILE ----
        const noteAbs = path.join(root, link.note.file);
        if (!fs.existsSync(noteAbs)) {
            const basename = path.basename(link.note.file);
            const matches = files.filter(f => path.basename(f.fsPath) === basename);

            if (matches.length === 1) {
                const newRel = vscode.workspace.asRelativePath(matches[0]);
                console.log('[Code-Memo] healed note path:', link.note.file, '→', newRel);
                link.note.file = newRel;
                changed = true;
            }
        }
    }

    if (changed) {
        MemoStore.save(data);
    }
}
