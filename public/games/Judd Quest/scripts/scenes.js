// scenes.js
export const scenes = {
  1: {
    up: 8,
    down: 4,
    left: 6,
    right: 2,
    tilemap: Array(37)
      .fill()
      .map(() => Array(50).fill(0))
      .map((row, i) => {
        if (i === 0 || i === 36) return row.map(() => 3);
        row[0] = 3;
        row[49] = 3;
        if (i === 5) for (let j = 10; j < 40; j++) row[j] = 1;
        if (i === 6) row[14] = 2;
        if (i === 6) row[15] = 4;
        if (i >= 10 && i < 20) for (let j = 20; j < 30; j++) row[j] = 5;
        return row;
      }),
  },
  2: {
    up: 7,
    down: 5,
    left: 1,
    right: null,
    tilemap: Array(37)
      .fill()
      .map(() => Array(50).fill(0))
      .map((row, i) => {
        if (i === 0 || i === 36) return row.map(() => 3);
        row[0] = 3;
        row[49] = 3;
        if (i === 15) for (let j = 10; j < 40; j++) row[j] = 1;
        if (i === 16) row[10] = 2;
        if (i >= 20 && i < 30) for (let j = 10; j < 20; j++) row[j] = 5;
        return row;
      }),
  },
  3: {
    up: 6,
    down: null,
    left: null,
    right: 4,
    tilemap: Array(37)
      .fill()
      .map(() => Array(50).fill(0))
      .map((row, i) => {
        if (i === 0 || i === 36) return row.map(() => 3);
        row[0] = 3;
        row[49] = 3;
        if (i === 30) for (let j = 20; j < 30; j++) row[j] = 1;
        if (i === 31) row[20] = 2;
        if (i >= 5 && i < 15) for (let j = 30; j < 40; j++) row[j] = 3;
        return row;
      }),
  },
  4: {
    up: 1,
    down: null,
    left: 3,
    right: 5,
    tilemap: Array(37)
      .fill()
      .map(() => Array(50).fill(0))
      .map((row, i) => {
        if (i === 0 || i === 36) return row.map(() => 3);
        row[0] = 3;
        row[49] = 3;
        if (i === 5) for (let j = 20; j < 30; j++) row[j] = 1;
        if (i === 6) row[20] = 2;
        if (i >= 15 && i < 25) for (let j = 10; j < 20; j++) row[j] = 5;
        return row;
      }),
  },
  5: {
    up: 2,
    down: null,
    left: 4,
    right: null,
    tilemap: Array(37)
      .fill()
      .map(() => Array(50).fill(0))
      .map((row, i) => {
        if (i === 0 || i === 36) return row.map(() => 3);
        row[0] = 3;
        row[49] = 3;
        if (i === 15) for (let j = 10; j < 20; j++) row[j] = 1;
        if (i >= 20 && i < 36) for (let j = 20; j < 40; j++) row[j] = 5;
        return row;
      }),
  },
  6: {
    up: 9,
    down: 3,
    left: null,
    right: 1,
    tilemap: Array(37)
      .fill()
      .map(() => Array(50).fill(0))
      .map((row, i) => {
        if (i === 0 || i === 36) return row.map(() => 3);
        row[0] = 3;
        row[49] = 3;
        if (i === 5) for (let j = 40; j < 50; j++) row[j] = 1;
        if (i === 6) row[40] = 2;
        if (i >= 10 && i < 20) for (let j = 10; j < 20; j++) row[j] = 3;
        return row;
      }),
  },
  7: {
    up: null,
    down: 2,
    left: null,
    right: null,
    tilemap: Array(37)
      .fill()
      .map(() => Array(50).fill(0))
      .map((row, i) => {
        if (i === 0 || i === 36) return row.map(() => 3);
        row[0] = 3;
        row[49] = 3;
        if (i === 30) for (let j = 20; j < 30; j++) row[j] = 1;
        if (i === 31) row[20] = 2;
        if (i >= 5 && i < 15) for (let j = 30; j < 40; j++) row[j] = 4;
        return row;
      }),
  },
  8: {
    up: null,
    down: 1,
    left: 9,
    right: 7,
    tilemap: Array(37)
      .fill()
      .map(() => Array(50).fill(0))
      .map((row, i) => {
        if (i === 0 || i === 36) return row.map(() => 3);
        row[0] = 3;
        row[49] = 3;
        if (i === 30) for (let j = 10; j < 20; j++) row[j] = 1;
        if (i === 31) row[10] = 2;
        if (i >= 10 && i < 20) for (let j = 30; j < 40; j++) row[j] = 5;
        return row;
      }),
  },
  9: {
    up: null,
    down: 6,
    left: null,
    right: 8,
    tilemap: Array(37)
      .fill()
      .map(() => Array(50).fill(0))
      .map((row, i) => {
        if (i === 0 || i === 36) return row.map(() => 3);
        row[0] = 3;
        row[49] = 3;
        if (i === 30) for (let j = 40; j < 50; j++) row[j] = 1;
        if (i === 31) row[40] = 2;
        if (i >= 5 && i < 15) for (let j = 10; j < 20; j++) row[j] = 3;
        return row;
      }),
  },
};
