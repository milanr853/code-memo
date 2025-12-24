import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MemoStore } from './data/memoStore';
import { hashFile } from './utils/hash';

export async function reconcileMemos() {
    const data = MemoStore.load();
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) return;

    const files = await vscode.workspace.findFiles(
        '**/*',
        '{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/.vscode/**}'
    );

    let changed = false;

    for (const link of data.links) {
        const abs = path.join(root, link.note.file);

        if (!fs.existsSync(abs) && link.note.hash) {
            for (const f of files) {
                const h = hashFile(f.fsPath);
                if (h === link.note.hash) {
                    const rel = vscode.workspace.asRelativePath(f);
                    console.log('[Code-Memo] healed by hash:', link.note.file, '→', rel);
                    link.note.file = rel;
                    changed = true;
                    break;
                }
            }
        }
    }

    if (changed) MemoStore.save(data);
}
