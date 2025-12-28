import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MemoFile, MemoLink } from './memoSchema';

const MEMO_FILE = '.vscode/code-memo.json';

export class MemoStore {
    private static getMemoPath(): string | null {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!root) return null;
        return path.join(root, MEMO_FILE);
    }

    static load(): MemoFile {
        const memoPath = this.getMemoPath();
        if (!memoPath || !fs.existsSync(memoPath)) {
            return { version: '1.0', links: [] };
        }

        try {
            const raw = fs.readFileSync(memoPath, 'utf-8').trim();
            if (!raw) return { version: '1.0', links: [] };
            return JSON.parse(raw);
        } catch {
            return { version: '1.0', links: [] };
        }
    }

    static save(data: MemoFile) {
        const memoPath = this.getMemoPath();
        if (!memoPath) return;
        fs.mkdirSync(path.dirname(memoPath), { recursive: true });
        fs.writeFileSync(memoPath, JSON.stringify(data, null, 2));
    }

    static upsert(link: MemoLink) {
        const data = this.load();

        data.links = data.links.filter(
            l => !(l.code.file === link.code.file && l.code.line === link.code.line && l.note.file === link.note.file)
        );

        data.links.push(link);
        this.save(data);
    }

    static updatePath(oldPath: string, newPath: string): boolean {
        const data = this.load();
        let changed = false;

        for (const link of data.links) {
            if (link.code.file === oldPath) {
                link.code.file = newPath;
                changed = true;
            }
            if (link.note.file === oldPath) {
                link.note.file = newPath;
                changed = true;
            }
        }

        if (changed) this.save(data);
        return changed;
    }

    static remove(link: MemoLink) {
        const data = this.load();
        data.links = data.links.filter(l => l.id !== link.id);
        this.save(data);
    }

    /**
     * Remove memos only if the *code file* is gone.
     * Notes may be created later, so they are NOT cleaned up.
     */
    static cleanupMissingFiles() {
        const data = this.load();
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!root) return;

        const exists = (p: string) => fs.existsSync(path.join(root, p));

        const before = data.links.length;

        data.links = data.links.filter(l => {
            const codeOk = exists(l.code.file);
            const noteOk = exists(l.note.file);

            if (!codeOk) {
                console.log('[Code-Memo] Removing memo — code file missing:', l.code.file);
            }

            if (!noteOk) {
                console.log('[Code-Memo] Removing memo — note file missing:', l.note.file);
            }

            return codeOk && noteOk;
        });

        if (data.links.length !== before) {
            this.save(data);

            // 🔥 Force CodeLens refresh after cleanup
            vscode.commands.executeCommand('editor.action.refreshCodeLens');
        }
    }
}
