// https://stackoverflow.com/a/19270021
export function GetMultipleRandomValues<T>(array: Array<T>, count: number) {
  var result = new Array(count),
    length = array.length,
    taken = new Array(length);
  if (count > length)
    throw new RangeError(
      "GetMultipleRandomValues: attempting to take more elements than size!"
    );
  while (count--) {
    var x = Math.floor(Math.random() * length);
    result[count] = array[x in taken ? taken[x] : x];
    taken[x] = --length in taken ? taken[length] : length;
  }
  return result;
}

// https://stackoverflow.com/a/2450976
export function ShuffleArray<T>(array: Array<T>) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
