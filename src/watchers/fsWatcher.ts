import * as vscode from 'vscode';
import { reconcileMemos } from '../reconcile';
import { debounce } from '../utils/debounce';

export function registerFsWatcher(context: vscode.ExtensionContext) {
    const debouncedReconcile = debounce(async () => {
        await reconcileMemos();
    }, 1200);

    const trigger = () => {
        debouncedReconcile();
        // retry once after filesystem stabilizes
        setTimeout(() => debouncedReconcile(), 1500);
    };

    const watcher = vscode.workspace.createFileSystemWatcher(
        '**/*',
        false,
        false,
        false
    );

    watcher.onDidCreate(trigger);
    watcher.onDidDelete(trigger);
    watcher.onDidChange(debouncedReconcile);

    context.subscriptions.push(watcher);
}
