import test from 'node:test';
import assert from 'node:assert';
import { normalizeDepartures } from '../../src/components/timetable/intervalsNormalizer.mjs';

function assertNormalized(input, expected) {
  const output = normalizeDepartures(input);
  assert.deepStrictEqual(output, expected);
}

test('No change', () => {
  assertNormalized(
    [
      { hours: '06', intervals: { '7': 10 } },
      { hours: '07', intervals: { '7': 10 } },
    ],
    [
      { hours: '06', intervals: { '7': 10 } },
      { hours: '07', intervals: { '7': 10 } },
    ],
  );
});

test('Single key basic normalize x', () => {
  assertNormalized(
    [
      { hours: '01', intervals: { '7': 9 } },
      { hours: '02', intervals: { '7': 10 } },
      { hours: '03', intervals: { '7': 12 } },
      { hours: '04', intervals: { '7': 11 } },
    ],
    [
      { hours: '01', intervals: { '7': 9 } },
      { hours: '02', intervals: { '7': 9 } },
      { hours: '03', intervals: { '7': 11 } },
      { hours: '04', intervals: { '7': 11 } },
    ],
  );
});

test('Real stop data test', () => {
  assertNormalized(
    [
      { hours: '05', intervals: { '7': 12 } },
      { hours: '06', intervals: { '7': 10, '16': 18 } },
      { hours: '07', intervals: { '7': 9, '16': 20 } },
      { hours: '08', intervals: { '7': 10, '16': 21 } },
      { hours: '09', intervals: { '7': 10, '16': 22 } },
      { hours: '10', intervals: { '7': 10, '16': 21 } },
      { hours: '11', intervals: { '7': 10, '16': 21 } },
      { hours: '12', intervals: { '7': 10, '16': 21 } },
      { hours: '13', intervals: { '7': 10, '16': 22 } },
      { hours: '14', intervals: { '7': 10, '16': 21 } },
      { hours: '15', intervals: { '7': 10, '16': 22 } },
      { hours: '16', intervals: { '7': 10, '16': 21 } },
      { hours: '17', intervals: { '7': 10, '16': 21 } },
      { hours: '18', intervals: { '7': 10, '16': 20 } },
      { hours: '19', intervals: { '7': 12, '16': 20 } },
      { hours: '20', intervals: { '7': 12, '16': 30 } },
      { hours: '21', intervals: { '7': 12, '16': 29 } },
      { hours: '22', intervals: { '7': 11 } },
      { hours: '23', intervals: { '7': 20 } },
      { hours: '00', intervals: { '7': 20 } },
      { hours: '01', intervals: { '7': 60 } },
    ],
    [
      { hours: '05', intervals: { '7': 12 } },
      { hours: '06', intervals: { '7': 9, '16': 18 } },
      { hours: '07', intervals: { '7': 9, '16': 20 } },
      { hours: '08', intervals: { '7': 9, '16': 20 } },
      { hours: '09', intervals: { '7': 9, '16': 21 } },
      { hours: '10', intervals: { '7': 9, '16': 21 } },
      { hours: '11', intervals: { '7': 9, '16': 21 } },
      { hours: '12', intervals: { '7': 9, '16': 21 } },
      { hours: '13', intervals: { '7': 9, '16': 21 } },
      { hours: '14', intervals: { '7': 9, '16': 21 } },
      { hours: '15', intervals: { '7': 9, '16': 21 } },
      { hours: '16', intervals: { '7': 9, '16': 21 } },
      { hours: '17', intervals: { '7': 9, '16': 21 } },
      { hours: '18', intervals: { '7': 9, '16': 20 } },
      { hours: '19', intervals: { '7': 11, '16': 20 } },
      { hours: '20', intervals: { '7': 11, '16': 29 } },
      { hours: '21', intervals: { '7': 11, '16': 29 } },
      { hours: '22', intervals: { '7': 11 } },
      { hours: '23', intervals: { '7': 20 } },
      { hours: '00', intervals: { '7': 20 } },
      { hours: '01', intervals: { '7': 60 } },
    ],
  );
});

test('Single key basic normalize', () => {
  assertNormalized(
    [
      { hours: '01', intervals: { '7': 3 } },
      { hours: '02', intervals: { '7': 2 } },
      { hours: '03', intervals: { '7': 1 } },
      { hours: '04', intervals: { '7': 0 } },
      { hours: '05', intervals: { '7': 2 } },
      { hours: '06', intervals: { '7': 3 } },
      { hours: '07', intervals: { '7': 3 } },
    ],
    [
      { hours: '01', intervals: { '7': 2 } },
      { hours: '02', intervals: { '7': 2 } },
      { hours: '03', intervals: { '7': 0 } },
      { hours: '04', intervals: { '7': 0 } },
      { hours: '05', intervals: { '7': 2 } },
      { hours: '06', intervals: { '7': 2 } },
      { hours: '07', intervals: { '7': 2 } },
    ],
  );
});

test('Multi-key normalization', () => {
  assertNormalized(
    [
      { hours: '06', intervals: { '7': 15 } },
      { hours: '07', intervals: { '7': 15, '16': 31 } },
      { hours: '08', intervals: { '7': 16, '16': 20 } },
    ],
    [
      { hours: '06', intervals: { '7': 15 } },
      { hours: '07', intervals: { '7': 15, '16': 31 } },
      { hours: '08', intervals: { '7': 15, '16': 20 } },
    ],
  );
});

test('Missing keys handled safely', () => {
  assertNormalized(
    [
      { hours: '01', intervals: { '7': 5 } },
      { hours: '02', intervals: {} },
      { hours: '03', intervals: { '7': 3 } },
    ],
    [
      { hours: '01', intervals: { '7': 5 } },
      { hours: '02', intervals: {} },
      { hours: '03', intervals: { '7': 3 } },
    ],
  );
});

test('Long chain normalize', () => {
  assertNormalized(
    [
      { hours: '01', intervals: { '7': 5 } },
      { hours: '02', intervals: { '7': 4 } },
      { hours: '03', intervals: { '7': 3 } },
      { hours: '04', intervals: { '7': 4 } },
      { hours: '05', intervals: { '7': 5 } },
    ],
    [
      { hours: '01', intervals: { '7': 4 } },
      { hours: '02', intervals: { '7': 4 } },
      { hours: '03', intervals: { '7': 3 } },
      { hours: '04', intervals: { '7': 3 } },
      { hours: '05', intervals: { '7': 5 } },
    ],
  );
});
