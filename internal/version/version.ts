const version: string = 'r12.1.2';

export const Version = (): string => {
    if (version !== '') return version;
    return '(devel)';
}

export const IsSet = (): boolean => version !== '';