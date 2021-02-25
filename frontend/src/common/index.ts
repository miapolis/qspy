const isDev = process.env.NODE_ENV === 'development';

export function websocketUrl(path: string): string {
    const location = window.location;
    if (isDev) return `ws://${location.hostname}:5000${path}`;
    return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${path}`;
}

export function relativeUrl(extension: string):string {
    const pathname = window.location.pathname;
    if (!extension.startsWith('/') && !pathname.endsWith('/')) extension = `/${extension}`;
    return window.location.href + extension;
}

export function checkOutdated(response: Response) {
    if (response.status === 418) {
        reloadOutdatedPage();
        return true;
    }
    return false;
}

export function reloadOutdatedPage() {
    console.log('Frontend version outdated; reloading.');
    window.location.reload();
}

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
    if (val === undefined || val === null) {
        fail(`Expected 'val' to be defined, but received ${val}`);
    }
}