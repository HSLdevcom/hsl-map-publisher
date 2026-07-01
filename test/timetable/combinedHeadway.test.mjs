import test from 'node:test';
import assert from 'node:assert';
import { computeCombinedColumn } from '../../src/components/timetable/combinedColumn.mjs';

test('equal intervals are halved when two routes interleave', () => {
  // bus1: 0,10,20,30,40,50  →  10 min
  // bus2: 5,15,25,35,45,55  →  10 min
  // combined: a bus every 5 min
  const result = computeCombinedColumn(['1', '2'], [{ hours: '08', intervals: { 1: 10, 2: 10 } }]);
  assert.deepStrictEqual(result, [{ hours: '08', combinedInterval: 5 }]);
});

test('different intervals combine correctly', () => {
  // route 7: every 10 min (6/hour), route 16: every 20 min (3/hour)
  // combined: 9/hour → 60/9 ≈ 7 min
  const result = computeCombinedColumn(
    ['7', '16'],
    [{ hours: '09', intervals: { 7: 10, 16: 20 } }],
  );
  assert.deepStrictEqual(result, [{ hours: '09', combinedInterval: 7 }]);
});

test('three routes with equal intervals', () => {
  // three routes every 15 min → combined every 5 min
  const result = computeCombinedColumn(
    ['1', '2', '3'],
    [{ hours: '10', intervals: { 1: 15, 2: 15, 3: 15 } }],
  );
  assert.deepStrictEqual(result, [{ hours: '10', combinedInterval: 5 }]);
});

test('route not running that hour is ignored', () => {
  // route 2 has no departures in this hour
  const result = computeCombinedColumn(['1', '2'], [{ hours: '23', intervals: { 1: 20 } }]);
  assert.deepStrictEqual(result, [{ hours: '23', combinedInterval: 20 }]);
});

test('no routes running returns null', () => {
  const result = computeCombinedColumn(['1', '2'], [{ hours: '04', intervals: {} }]);
  assert.deepStrictEqual(result, [{ hours: '04', combinedInterval: null }]);
});

test('hours label is preserved across multiple rows', () => {
  const result = computeCombinedColumn(
    ['7', '16'],
    [
      { hours: '07-10', intervals: { 7: 10, 16: 10 } },
      { hours: '20', intervals: { 7: 20, 16: 20 } },
    ],
  );
  assert.deepStrictEqual(result, [
    { hours: '07-10', combinedInterval: 5 },
    { hours: '20', combinedInterval: 10 },
  ]);
});
