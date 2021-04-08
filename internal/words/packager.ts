import * as fs from 'fs';
import * as words from './words';

export const DEFAULT = LoadStaticAsset('/default.txt');
export const DEFAULT_PLUS = LoadStaticAsset('/default-plus.txt');
export const SPYSCHOOL = LoadStaticAsset('/spyschool.txt');
export const CHRISTMAS = LoadStaticAsset('/christmas.txt');

function LoadStaticAsset (relativePath: string): words.Pack {
    const file = fs.readFileSync(`${__dirname}/static${relativePath}`, 'utf-8');
    const data = words.NewListFromFile(file);
    if (data.error || !data.data) throw(`Error reading static asset! ${data.error} at ${relativePath}`);
    return words.CreatePack(data);
}