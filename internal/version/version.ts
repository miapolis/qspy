const version:string = 'r12.0.4';

export const Version = ():string => {
    if (version !== '') return version;
    return '(devel)';
}

export const IsSet = ():boolean => version !== '';