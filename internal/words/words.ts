export interface InfoPair {
    Location: string;
    Roles: string[] | undefined; // Users can specify no roles if they want
}

const MAX_LOCATION_LENGTH = 25;
const MAX_ROLE_LENGTH = 25;

export interface ListResult { result: InfoPair[] | undefined, error: string | undefined }
export const NewListFromFile = (data: string): ListResult => {
    // First, make sure there is actual data
    if (data.trim().length === 0) return CreateError(0, 'N/A', 'No data specified');

    const lines = data.trim().split(/\r?\n/);
    const pairs = new Array<InfoPair>();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        try {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) return CreateError(i, 'N/A', 'Error parsing location: no colon specified');

            const location = line.substring(0, colonIndex).trim();
            if (location.length > MAX_LOCATION_LENGTH) return CreateError(i, `${location.substr(0, MAX_LOCATION_LENGTH)}...`, 'Error parsing location: location name too long');
            if (location.length === 0) return CreateError(i, 'N/A', 'Error parsing location: location name cannot be empty');
            
            const roleData = line.substr(colonIndex + 1);
            const roleArray = roleData.split(',');
            const roles = new Array<string>();

            for (const roleString of roleArray) { 
                const final = roleString.trim();
                if (final.length > MAX_ROLE_LENGTH) return CreateError(i, location, `Error parsing roles: role '${final.substr(0, MAX_ROLE_LENGTH)}...' too long`);
                if (final.length === 0) return CreateError(i, location, `Error parsing roles: role cannot be empty`);
                roles.push(final);
            }

            if (roles.length === 1 && roles[0] === '') { // No roles specified; mark as undefined
                pairs.push({Location: location, Roles: undefined}); 
                continue;
            }

            pairs.push({Location: location, Roles: roles});
        } catch { return CreateError(i, 'N/A', 'An unknown parsing error occurred'); }
    }

    return { result: pairs, error: undefined } // Success
}

const CreateError = (lineNumber: number, locationName: string, err: string) => {
    return { result: undefined, error: `LINE ${lineNumber + 1} - '${locationName}': ${err}` }
}