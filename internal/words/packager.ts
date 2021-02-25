import * as fs from 'fs';
import * as words from './words';

export const DEFAULT = LoadStaticAsset('/default.txt');

function LoadStaticAsset (relativePath: string): words.InfoPair[] {
    const file = fs.readFileSync(`${__dirname}/static${relativePath}`, 'utf-8');
    const data = words.NewListFromFile(file);
    if (data.error || !data.result) throw(`Error reading static asset! ${data.error} at ${relativePath}`);
    return data.result;
}