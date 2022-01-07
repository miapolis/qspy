export interface InfoPair {
  Location: string;
  Roles: string[] | undefined; // Users can specify no roles if they want
}

export const SPYSCHOOL_LOCATION = "SpySchool";

const MAX_LOCATION_LENGTH = 25;
const MAX_ROLE_LENGTH = 25;

const GROUP_NAME_TOKEN = "GROUP_NAME";
const GROUP_DESCRIPTION_TOKEN = "GROUP_DESCRIPTION";

export interface Pack {
  name: string | undefined;
  description: string | undefined;
  data: InfoPair[];
  locationCount: number;
  roleCount: number;
}

export interface ListResult {
  listName: string | undefined;
  listDescription: string | undefined;
  data: InfoPair[] | undefined;
  error: string | undefined;
}
export const NewListFromFile = (data: string): ListResult => {
  // First, make sure there is actual data
  if (data.trim().length === 0)
    return CreateError(0, "N/A", "No data specified");

  const lines = data.trim().split(/\r?\n/);
  const pairs = new Array<InfoPair>();

  let result = <ListResult>{};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    try {
      if (line.startsWith("#")) {
        // Definition line that doesn't contain words
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1)
          return CreateError(
            i,
            "N/A",
            "Error parsing definition: no colon specified"
          );
        const token = line.substring(1, colonIndex).trim();
        const value = line.substring(colonIndex + 1);
        switch (token) {
          case GROUP_NAME_TOKEN:
            result.listName = value;
            break;
          case GROUP_DESCRIPTION_TOKEN:
            result.listDescription = value;
            break;
        }
        continue;
      }

      const colonIndex = line.indexOf(":");
      if (colonIndex === -1)
        return CreateError(
          i,
          "N/A",
          "Error parsing location: no colon specified"
        );

      const location = line.substring(0, colonIndex).trim();
      if (location.length > MAX_LOCATION_LENGTH)
        return CreateError(
          i,
          `${location.substr(0, MAX_LOCATION_LENGTH)}...`,
          "Error parsing location: location name too long"
        );
      if (location.length === 0)
        return CreateError(
          i,
          "N/A",
          "Error parsing location: location name cannot be empty"
        );

      const roleData = line.substr(colonIndex + 1);
      const roleArray = roleData.split(",");
      const roles = new Array<string>();

      for (const roleString of roleArray) {
        const final = roleString.trim();
        if (final.length > MAX_ROLE_LENGTH)
          return CreateError(
            i,
            location,
            `Error parsing roles: role '${final.substr(
              0,
              MAX_ROLE_LENGTH
            )}...' too long`
          );
        // Location was specified, but it was whitespace
        if (roleString.length !== final.length && final.length === 0)
          return CreateError(
            i,
            location,
            `Error parsing roles: role cannot be empty`
          );
        roles.push(final);
      }

      if (roles.length === 1 && roles[0] === "") {
        // No roles specified; mark as undefined
        pairs.push({ Location: location, Roles: undefined });
        continue;
      }

      pairs.push({ Location: location, Roles: roles });
    } catch {
      return CreateError(i, "N/A", "An unknown parsing error occurred");
    }
  }

  result.data = pairs;
  return result; // Success
};

export const CreatePack = (list: ListResult): Pack => {
  let sumLocations = 0,
    sumRoles = 0;
  if (!list.data) throw "Attempting to create a pack without any data!";
  for (const pair of list.data) {
    sumLocations += 1;
    sumRoles += pair.Roles ? pair.Roles.length : 0;
  }
  return {
    name: list.listName,
    description: list.listDescription,
    data: list.data,
    locationCount: sumLocations,
    roleCount: sumRoles,
  };
};

const CreateError = (
  lineNumber: number,
  locationName: string,
  err: string
): ListResult => {
  return {
    listName: undefined,
    listDescription: undefined,
    data: undefined,
    error: `LINE ${lineNumber + 1} - '${locationName}': ${err}`,
  };
};
