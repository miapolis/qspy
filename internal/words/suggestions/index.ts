export interface List {
  data: string[];
}

export interface ListResult {
  list: List | undefined;
  error: string | undefined;
}

const MAX_SUGGESTION_LENGTH = 200;

export const NewListFromFile = (data: string): ListResult => {
  if (data.trim().length === 0)
    return CreateError(0, "N/A", "No data specified");
  const lines = data.trim().split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > MAX_SUGGESTION_LENGTH)
      return CreateError(i, line, "Line too long");
  }

  return {
    list: { data: lines },
    error: undefined,
  };
};

const CreateError = (
  lineNumber: number,
  suggestion: string,
  err: string
): ListResult => {
  return {
    list: undefined,
    error: `LINE ${lineNumber + 1} - '${suggestion}': ${err}`,
  };
};
