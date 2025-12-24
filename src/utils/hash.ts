import * as crypto from 'crypto';
import * as fs from 'fs';

export function hashString(s: string) {
    return crypto.createHash('sha1').update(s).digest('hex');
}

export function hashFile(path: string) {
    if (!fs.existsSync(path)) return null;
    return crypto.createHash('sha1').update(fs.readFileSync(path)).digest('hex');
}
