import * as vscode from 'vscode';
import { MemoStore } from '../data/memoStore';
import { normalizePath } from '../utils/paths';

export function registerRenameWatcher(context: vscode.ExtensionContext) {
    const disposable = vscode.workspace.onDidRenameFiles(event => {
        console.log('[Code-Memo] Rename event fired');

        for (const file of event.files) {
            const oldPath = normalizePath(file.oldUri);
            const newPath = normalizePath(file.newUri);

            console.log('[Code-Memo] oldPath from event:', oldPath);
            console.log('[Code-Memo] newPath from event:', newPath);

            const didUpdate = MemoStore.updatePath(oldPath, newPath);
            console.log('[Code-Memo] update result:', didUpdate);
        }
    });

    context.subscriptions.push(disposable);
}
