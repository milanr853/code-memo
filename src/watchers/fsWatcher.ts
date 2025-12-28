import * as vscode from 'vscode';
import { reconcileMemos } from '../reconcile';
import { MemoStore } from '../data/memoStore';
import { debounce } from '../utils/debounce';

export function registerFsWatcher(context: vscode.ExtensionContext) {
    const debouncedReconcile = debounce(async () => {
        await reconcileMemos();
    }, 400);

    const debouncedCleanup = debounce(() => {
        MemoStore.cleanupMissingFiles();
    }, 400);

    const watcher = vscode.workspace.createFileSystemWatcher(
        '**/*',
        false,
        false,
        false
    );

    watcher.onDidDelete(() => {
        debouncedCleanup();
    });

    watcher.onDidCreate(() => {
        debouncedReconcile();
    });

    watcher.onDidChange(() => {
        debouncedReconcile();
    });

    context.subscriptions.push(watcher);
}
