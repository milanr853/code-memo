import * as crypto from 'crypto';
import * as fs from 'fs';

export function hashString(s: string) {
    return crypto.createHash('sha1').update(s).digest('hex');
}

export function hashFile(filePath: string): string | null {
    if (!fs.existsSync(filePath)) return null;
    const buf = fs.readFileSync(filePath);
    return crypto.createHash('sha1').update(buf).digest('hex');
}

