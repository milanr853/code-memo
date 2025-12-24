import * as vscode from 'vscode';
import { reconcileMemos } from '../reconcile';

export function registerFsWatcher(context: vscode.ExtensionContext) {
    const watcher = vscode.workspace.createFileSystemWatcher('**/*');

    watcher.onDidCreate(() => reconcileMemos().catch(console.error));
    watcher.onDidDelete(() => reconcileMemos().catch(console.error));
    watcher.onDidChange(() => reconcileMemos().catch(console.error));

    context.subscriptions.push(watcher);
}
