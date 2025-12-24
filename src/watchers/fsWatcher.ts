import * as vscode from 'vscode';
import { reconcileMemos } from '../reconcile';
import { debounce } from '../utils/debounce';

export function registerFsWatcher(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('codeMemo');
    const enabled = config.get<boolean>('autoReconcile', true);

    if (!enabled) {
        console.log('[Code-Memo] autoReconcile disabled by user');
        return;
    }

    const delay = config.get<number>('reconcileDelay', 800);

    const debouncedReconcile = debounce(() => {
        reconcileMemos().catch(console.error);
    }, delay);

    const watcher = vscode.workspace.createFileSystemWatcher(
        '**/*',
        false,
        false,
        false
    );

    watcher.onDidCreate(debouncedReconcile);
    watcher.onDidDelete(debouncedReconcile);
    watcher.onDidChange(debouncedReconcile);

    context.subscriptions.push(watcher);
}
