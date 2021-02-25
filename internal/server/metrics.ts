let clientCount = 0;
let roomCount = 0;

export const ClientCount = () => clientCount;
export const RoomCount = () => roomCount;

export const NewClient = () => clientCount++;
export const RemoveClient = () => clientCount--;
export const NewRoom = () => roomCount++;
export const RemoveRoom = () => roomCount--;