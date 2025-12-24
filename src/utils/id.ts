export function generateId() {
    return 'memo-' + Math.random().toString(36).substring(2, 10);
}
