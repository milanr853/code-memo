import * as vscode from 'vscode';

export async function openMemo(path: string) {
    const uri = vscode.Uri.file(
        vscode.workspace.workspaceFolders![0].uri.fsPath + '/' + path
    );
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
}
