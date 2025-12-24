import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MemoStore } from './data/memoStore';

const STALE_DAYS = 30;

export async function showHealth() {
    const data = MemoStore.load();
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) return;

    const now = Date.now();
    const staleMs = STALE_DAYS * 24 * 60 * 60 * 1000;

    let orphaned = [];
    let stale = [];
    let noBacklink = [];

    for (const link of data.links) {
        const codeAbs = path.join(root, link.code.file);
        const noteAbs = path.join(root, link.note.file);

        if (!fs.existsSync(codeAbs) || !fs.existsSync(noteAbs)) {
            orphaned.push(link);
        }

        if (now - new Date(link.createdAt).getTime() > staleMs) {
            stale.push(link);
        }
    }

    // memos without backlinks = note exists but not linked from any code line
    const noteUsage = new Map<string, number>();
    for (const link of data.links) {
        noteUsage.set(link.note.file, (noteUsage.get(link.note.file) || 0) + 1);
    }

    for (const [note, count] of noteUsage) {
        if (count === 0) noBacklink.push(note);
    }

    const message = [
        'Memo Health',
        '',
        `Total memos: ${data.links.length}`,
        `Orphaned memos: ${orphaned.length}`,
        `Stale memos (> ${STALE_DAYS} days): ${stale.length}`,
        `Memos without backlinks: ${noBacklink.length}`
    ].join('\n');

    vscode.window.showInformationMessage(message, { modal: true });
}
