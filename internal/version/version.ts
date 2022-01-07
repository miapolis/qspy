const version: string = "r13.3.1";

export const Version = (): string => {
  if (version !== "") return version;
  return "(devel)";
};

export const IsSet = (): boolean => version !== "";
