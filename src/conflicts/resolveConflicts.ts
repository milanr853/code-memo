import * as vscode from 'vscode';
import { MemoStore } from '../data/memoStore';
import { Conflict } from './conflictTypes';

let currentConflicts: Conflict[] = [];

export function getConflicts() {
    return currentConflicts;
}

export function resolveConflicts() {
    const data = MemoStore.load();
    const seen = new Set<string>();
    const ids = new Set<string>();
    const conflicts: Conflict[] = [];
    const cleaned = [];

    for (const link of data.links) {
        const key = `${link.code.file}:${link.code.line}->${link.note.file}`;

        if (seen.has(key)) {
            conflicts.push({ type: 'DUPLICATE', key });
            continue;
        }

        if (ids.has(link.id)) {
            conflicts.push({ type: 'ID_COLLISION', id: link.id });
            link.id = crypto.randomUUID();
        }

        seen.add(key);
        ids.add(link.id);
        cleaned.push(link);
    }

    currentConflicts = conflicts;

    if (cleaned.length !== data.links.length) {
        MemoStore.save({ ...data, links: cleaned });
    }

    if (conflicts.length > 0) {
        vscode.window.showQuickPick(
            conflicts.map(c => conflictLabel(c)),
            { placeHolder: 'Code-Memo conflicts detected' }
        );
    }
}

function conflictLabel(c: Conflict) {
    switch (c.type) {
        case 'DUPLICATE':
            return `Duplicate memo: ${c.key}`;
        case 'ID_COLLISION':
            return `ID collision: ${c.id}`;
        case 'INVALID_JSON':
            return 'Invalid memo JSON';
        case 'DANGLING':
            return `Dangling memo: ${c.code} → ${c.note}`;
    }
}
