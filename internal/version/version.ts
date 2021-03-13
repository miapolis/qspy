const version: string = 'r12.2.0';

export const Version = (): string => {
    if (version !== '') return version;
    return '(devel)';
}

export const IsSet = (): boolean => version !== '';