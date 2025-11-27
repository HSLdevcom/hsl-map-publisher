function normalizeByContiguousClusters(arr) {
  const n = arr.length;
  if (n <= 1) return arr.slice();

  const out = arr.slice();
  let i = 0;

  while (i < n) {
    let segMin = out[i];
    let segMax = out[i];
    let j = i + 1;

    while (j < n) {
      const v = out[j];
      const newMin = Math.min(segMin, v);
      const newMax = Math.max(segMax, v);
      if (newMax - newMin <= 1) {
        segMin = newMin;
        segMax = newMax;
        j++;
      } else break;
    }

    for (let k = i; k < j; k++) out[k] = segMin;

    i = j;
  }

  return out;
}

/**
 *
 * @param {{hours: string, intervals: Record<string, number>}[]} data
 */
export const normalizeDepartures = data => {
  const result = data.map(r => ({ ...r, intervals: { ...r.intervals } }));
  const keys = [...new Set(data.flatMap(r => Object.keys(r.intervals)))];

  for (const key of keys) {
    const keyData = data.map(row => row.intervals[key]);
    const normalized = normalizeByContiguousClusters(keyData);

    for (let i = 0; i < result.length; i++) {
      if (normalized[i] !== null && normalized[i] !== undefined) {
        result[i].intervals[key] = normalized[i];
      }
    }
  }
  return result;
};
