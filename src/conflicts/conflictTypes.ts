export type Conflict =
    | { type: 'DUPLICATE'; key: string }
    | { type: 'INVALID_JSON' }
    | { type: 'ID_COLLISION'; id: string }
    | { type: 'DANGLING'; code: string; note: string };
