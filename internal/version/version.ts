const version:string = 'r12.0.5';

export const Version = ():string => {
    if (version !== '') return version;
    return '(devel)';
}

export const IsSet = ():boolean => version !== '';