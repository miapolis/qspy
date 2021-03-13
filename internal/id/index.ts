import Hashids from 'hashids';

export class Generator {
    hashid: Hashids;
    next: number = 0;

    constructor (salt: string) {
        this.hashid = new Hashids(salt, 8);
    }

    public Next (): string {
        const value = ++this.next;
        return this.hashid.encode(value);
    } 
}