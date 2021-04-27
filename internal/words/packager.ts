import * as fs from 'fs';
import * as words from './words';
import * as suggestions from './suggestions';

export const DEFAULT = LoadStaticAsset('/default.txt');
export const DEFAULT_PLUS = LoadStaticAsset('/default-plus.txt');
export const SPYSCHOOL = LoadStaticAsset('/spyschool.txt');
export const CHRISTMAS = LoadStaticAsset('/christmas.txt');

// DO NOT MODIFY OR CREATE PACKS WITH THE NAME 'SUGGESTIONS'
// RESERVED FOR QUESTION SUGGESTIONS
export const SUGGESTIONS = LoadSuggestions();

function LoadStaticAsset (relativePath: string): words.Pack {
    const file = fs.readFileSync(`${__dirname}/static${relativePath}`, 'utf-8');
    const data = words.NewListFromFile(file);
    if (data.error || !data.data) throw(`Error reading static asset! ${data.error} at ${relativePath}`);
    return words.CreatePack(data);
}

function LoadSuggestions (): suggestions.List {
    const file = fs.readFileSync(`${__dirname}/suggestions/static/suggestions.txt`, 'utf-8');
    const data = suggestions.NewListFromFile(file);
    if (data.error || !data.list) throw(`Error reading suggestions! ${data.error}`);
    return data.list;
}