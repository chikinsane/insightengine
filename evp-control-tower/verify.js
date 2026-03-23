// Verify: calcOverallScore(3.7) === 68
const avg1to5 = 3.7;
const result = Math.round(((avg1to5 - 1) / 4) * 100);
console.log(`calcOverallScore(${avg1to5}) = ${result}`);
console.log(`Expected: 68, Got: ${result}, Pass: ${result === 68}`);
