export default function routeCompare(routea, routeb) {
  const partsA = (routea.routeId || '').match(/^[A-Za-z]?(0*)([0-9]*)/);
  const partsB = (routeb.routeId || '').match(/^[A-Za-z]?(0*)([0-9]*)/);
  if (partsA[1].length !== partsB[1].length) {
    if (partsA[1].length + partsA[2].length === 0) {
      return -1; // A is the one with no numbers at all, wins leading zero
    }
    if (partsB[1].length + partsB[2].length === 0) {
      return 1; // B is the one with no numbers at all, wins leading zero
    }
    return partsB[1].length - partsA[1].length; // more leading zeros wins
  }
  const numberA = parseInt(partsA[2] || '0', 10);
  const numberB = parseInt(partsB[2] || '0', 10);
  return numberA - numberB || routea.routeId.localeCompare(routeb.routeId);
}
