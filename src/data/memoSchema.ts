export interface MemoLink {
    id: string;
    code: {
        file: string;
        line: number;
    };
    note: {
        file: string;
        section?: string;
    };
    createdAt: string;
    lastVerifiedAt?: string;
}

export interface MemoFile {
    version: string;
    links: MemoLink[];
}
