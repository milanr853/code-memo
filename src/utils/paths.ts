import * as vscode from 'vscode';

export function normalizePath(input: vscode.Uri | string): string {
    let p =
        typeof input === 'string'
            ? input
            : vscode.workspace.asRelativePath(input);

    return p.replace(/^\.?\//, '').replace(/\\/g, '/');
}
