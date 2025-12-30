import * as vscode from 'vscode';
import { getConflicts } from '../conflicts/resolveConflicts';

export class ConflictTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    getTreeItem(e: vscode.TreeItem) { return e; }

    getChildren() {
        return getConflicts().map(c => new vscode.TreeItem(conflictText(c)));
    }
}

function conflictText(c: any) {
    if (c.type === 'DUPLICATE') return `Duplicate: ${c.key}`;
    if (c.type === 'ID_COLLISION') return `ID collision: ${c.id}`;
    if (c.type === 'DANGLING') return `Dangling: ${c.code} → ${c.note}`;
    return 'Conflict';
}
