import * as vscode from 'vscode';
import { MemoStore } from '../data/memoStore';

export class MemoTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(): vscode.TreeItem[] {
        const data = MemoStore.load();
        return data.links.map(link => {
            const item = new vscode.TreeItem(
                `${link.code.file}:${link.code.line} → ${link.note.file}`
            );
            item.command = {
                command: 'codeMemo.openMemo',
                title: 'Open Memo',
                arguments: [link.note.file],
            };
            return item;
        });
    }
}
