import * as vscode from 'vscode';
import { reconcileMemos } from '../reconcile';
import { MemoStore } from '../data/memoStore';
import { debounce } from '../utils/debounce';

type FsEvent = { path: string; time: number };

const recentCreates: FsEvent[] = [];
const recentDeletes: FsEvent[] = [];

const WINDOW = 2000; // ms

export function registerFsWatcher(context: vscode.ExtensionContext) {
    const debouncedReconcile = debounce(async () => {
        console.log('[FS] reconcile triggered');
        await reconcileMemos();
    }, 400);

    const watcher = vscode.workspace.createFileSystemWatcher('**/*', false, false, false);

    watcher.onDidCreate(uri => {
        const rel = vscode.workspace.asRelativePath(uri);
        console.log('[FS] CREATE', rel);

        const now = Date.now();
        recentCreates.push({ path: rel, time: now });

        const match = recentDeletes.find(d => isRenamePair(d.path, rel, d.time, now));
        if (match) {
            console.log('[FS] rename detected (delete→create):', match.path, '→', rel);
            MemoStore.updatePath(match.path, rel);
            removeEvent(recentDeletes, match);
            return;
        }

        debouncedReconcile();
    });

    watcher.onDidDelete(uri => {
        const rel = vscode.workspace.asRelativePath(uri);
        console.log('[FS] DELETE', rel);

        const now = Date.now();
        recentDeletes.push({ path: rel, time: now });

        const match = recentCreates.find(c => isRenamePair(rel, c.path, now, c.time));
        if (match) {
            console.log('[FS] rename detected (create→delete):', rel, '→', match.path);
            MemoStore.updatePath(rel, match.path);
            removeEvent(recentCreates, match);
            return;
        }

        setTimeout(() => {
            const stillDeleted = recentDeletes.find(d => d.path === rel);
            if (stillDeleted) {
                console.log('[FS] confirmed delete:', rel);
                MemoStore.cleanupMissingFiles();
                removeEvent(recentDeletes, stillDeleted);
            }
        }, WINDOW);
    });

    watcher.onDidChange(() => {
        debouncedReconcile();
    });

    context.subscriptions.push(watcher);
}

function isRenamePair(oldPath: string, newPath: string, t1: number, t2: number) {
    if (Math.abs(t1 - t2) > WINDOW) return false;

    const oldDir = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newDir = newPath.substring(0, newPath.lastIndexOf('/'));
    const oldExt = oldPath.split('.').pop();
    const newExt = newPath.split('.').pop();

    return oldDir === newDir && oldExt === newExt;
}

function removeEvent(arr: FsEvent[], e: FsEvent) {
    const i = arr.indexOf(e);
    if (i >= 0) arr.splice(i, 1);
}
