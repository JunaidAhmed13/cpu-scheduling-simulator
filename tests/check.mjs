// check.mjs - compares the simulator with answers we worked out by hand.
// Run with:  npm test
import { fcfs, sjf, srtf, roundRobin, priorityNP, priorityP } from "../src/scheduler.js";

// Test set A (4 processes, used in the report)
const setA = [
  { id: "P1", arrival: 0, burst: 5, priority: 3 },
  { id: "P2", arrival: 1, burst: 3, priority: 2 },
  { id: "P3", arrival: 2, burst: 8, priority: 1 },
  { id: "P4", arrival: 3, burst: 6, priority: 4 },
];

// Test set B (idle gap from 3 to 5, and P2/P3 tie on everything)
const setB = [
  { id: "P1", arrival: 0, burst: 3, priority: 2 },
  { id: "P2", arrival: 5, burst: 2, priority: 1 },
  { id: "P3", arrival: 5, burst: 2, priority: 1 },
  { id: "P4", arrival: 6, burst: 1, priority: 3 },
];

// gantt chart as text, e.g. "P1 0-5 | P2 5-8"
const ganttText = (r) => r.gantt.map((b) => `${b.id} ${b.start}-${b.end}`).join(" | ");

// expected values worked out by hand: [gantt, avg WT, avg TAT, avg RT, context switches]
const tests = [
  ["A FCFS", fcfs(setA), "P1 0-5 | P2 5-8 | P3 8-16 | P4 16-22", 5.75, 11.25, 5.75, 3],
  ["A SJF", sjf(setA), "P1 0-5 | P2 5-8 | P4 8-14 | P3 14-22", 5.25, 10.75, 5.25, 3],
  ["A SRTF", srtf(setA), "P1 0-1 | P2 1-4 | P1 4-8 | P4 8-14 | P3 14-22", 5.0, 10.5, 4.25, 4],
  ["A RR q=2", roundRobin(setA, 2),
    "P1 0-2 | P2 2-4 | P3 4-6 | P1 6-8 | P4 8-10 | P2 10-11 | P3 11-13 | P1 13-14 | P4 14-16 | P3 16-18 | P4 18-20 | P3 20-22",
    9.75, 15.25, 2.0, 11],
  ["A Priority NP", priorityNP(setA), "P1 0-5 | P3 5-13 | P2 13-16 | P4 16-22", 7.0, 12.5, 7.0, 3],
  ["A Priority P", priorityP(setA), "P1 0-1 | P2 1-2 | P3 2-10 | P2 10-12 | P1 12-16 | P4 16-22", 8.0, 13.5, 3.25, 5],

  // own feature: context switch time = 1
  ["A FCFS cs=1", fcfs(setA, 1), "P1 0-5 | CS 5-6 | P2 6-9 | CS 9-10 | P3 10-18 | CS 18-19 | P4 19-25", 7.25, 12.75, 7.25, 3],
  ["A RR q=2 cs=1", roundRobin(setA, 2, 1),
    "P1 0-2 | CS 2-3 | P2 3-5 | CS 5-6 | P3 6-8 | CS 8-9 | P1 9-11 | CS 11-12 | P4 12-14 | CS 14-15 | P2 15-16 | CS 16-17 | P3 17-19 | CS 19-20 | P1 20-21 | CS 21-22 | P4 22-24 | CS 24-25 | P3 25-27 | CS 27-28 | P4 28-30 | CS 30-31 | P3 31-33",
    18.0, 23.5, 3.75, 11],

  // edge cases: idle CPU and ties
  ["B FCFS", fcfs(setB), "P1 0-3 | IDLE 3-5 | P2 5-7 | P3 7-9 | P4 9-10", 1.25, 3.25, 1.25, 2],
  ["B SJF", sjf(setB), "P1 0-3 | IDLE 3-5 | P2 5-7 | P4 7-8 | P3 8-10", 1.0, 3.0, 1.0, 2],
  ["B SRTF", srtf(setB), "P1 0-3 | IDLE 3-5 | P2 5-7 | P4 7-8 | P3 8-10", 1.0, 3.0, 1.0, 2],
  ["B RR q=2", roundRobin(setB, 2), "P1 0-3 | IDLE 3-5 | P2 5-7 | P3 7-9 | P4 9-10", 1.25, 3.25, 1.25, 2],
  ["B Priority NP", priorityNP(setB), "P1 0-3 | IDLE 3-5 | P2 5-7 | P3 7-9 | P4 9-10", 1.25, 3.25, 1.25, 2],
  ["B Priority P", priorityP(setB), "P1 0-3 | IDLE 3-5 | P2 5-7 | P3 7-9 | P4 9-10", 1.25, 3.25, 1.25, 2],
];

let passed = 0;
for (const [name, r, gantt, wt, tat, rt, cs] of tests) {
  const ok = ganttText(r) === gantt && r.avgWaiting === wt && r.avgTurnaround === tat &&
    r.avgResponse === rt && r.switches === cs;
  if (ok) passed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) {
    console.log("   got gantt:", ganttText(r));
    console.log("   got WT, TAT, RT, CS:", r.avgWaiting, r.avgTurnaround, r.avgResponse, r.switches);
  }
}
console.log(`\n${passed} of ${tests.length} tests passed`);
