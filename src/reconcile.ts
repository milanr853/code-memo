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
        '{** /node_modules/ **,** /.git/ **,** /dist/ **,** /build/ **,** /.vscode/ **} '
    );

    let changed = false;
    const stillValid = [];

    for (const link of data.links) {
        let valid = true;

        // ---- CODE FILE ----
        let codeAbs = path.join(root, link.code.file);
        if (!fs.existsSync(codeAbs)) {
            const basename = path.basename(link.code.file);
            const matches = files.filter(f => path.basename(f.fsPath) === basename);

            if (matches.length === 1) {
                link.code.file = vscode.workspace.asRelativePath(matches[0]);
                changed = true;
            } else {
                valid = false;
            }
        }

        // ---- NOTE FILE ----
        let noteAbs = path.join(root, link.note.file);
        if (!fs.existsSync(noteAbs)) {
            const basename = path.basename(link.note.file);
            const matches = files.filter(f => path.basename(f.fsPath) === basename);

            if (matches.length === 1) {
                link.note.file = vscode.workspace.asRelativePath(matches[0]);
                changed = true;
            } else {
                valid = false;
            }
        }

        if (valid) stillValid.push(link);
        else changed = true;
    }

    if (changed) {
        data.links = stillValid;
        MemoStore.save(data);
    }
}
