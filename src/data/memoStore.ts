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
        if (!memoPath) return { version: '1.0', links: [] };

        if (!fs.existsSync(memoPath)) {
            const initial: MemoFile = { version: '1.0', links: [] };
            fs.mkdirSync(path.dirname(memoPath), { recursive: true });
            fs.writeFileSync(memoPath, JSON.stringify(initial, null, 2));
            return initial;
        }

        return JSON.parse(fs.readFileSync(memoPath, 'utf-8'));
    }

    static save(data: MemoFile) {
        const memoPath = this.getMemoPath();
        if (!memoPath) return;
        fs.writeFileSync(memoPath, JSON.stringify(data, null, 2));
    }

    static add(link: MemoLink) {
        const data = this.load();
        data.links.push(link);
        this.save(data);
    }

    static remove(id: string) {
        const data = this.load();
        data.links = data.links.filter(l => l.id !== id);
        this.save(data);
    }

    static findByCode(file: string, line: number): MemoLink[] {
        const data = this.load();
        return data.links.filter(
            l => l.code.file === file && l.code.line === line
        );
    }
}
