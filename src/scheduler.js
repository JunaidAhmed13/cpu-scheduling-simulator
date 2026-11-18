// scheduler.js
// All the CPU scheduling logic of the project is in this file.
// The GUI (App.jsx) only collects the input and shows what these functions return.
//
// A process looks like: { id: "P1", arrival: 0, burst: 5, priority: 3 }
// Lower priority number = higher priority.
// csTime = context switch time (our own feature). It is added every time the
// CPU moves from one process to a different process. It is not added for the
// first process or after the CPU was idle, because then there is no old
// process whose state has to be saved.

// ---------- small helpers ----------

// make a working copy of the processes so we never change the user's input
function copyProcesses(processes) {
  return processes.map((p, index) => ({
    ...p,
    index: index, // position in the input table, used to break ties
    remaining: p.burst,
    start: -1, // time the process first gets the CPU (-1 = not yet)
    completion: 0,
  }));
}

// add a block to the Gantt chart; join it with the last block if it is the same process
function addBlock(gantt, id, start, end) {
  const last = gantt[gantt.length - 1];
  if (last && last.id === id && last.end === start) {
    last.end = end;
  } else {
    gantt.push({ id: id, start: start, end: end });
  }
}

// tie breaking rule used by every algorithm: earlier arrival first, then lower index (P1 before P2)
function tieBreak(a, b) {
  if (a.arrival !== b.arrival) return a.arrival - b.arrival;
  return a.index - b.index;
}

// pick the best process from the ready list using the given key (smaller key wins)
function pickBest(ready, key) {
  let best = ready[0];
  for (const p of ready) {
    const diff = key(p) - key(best);
    if (diff < 0 || (diff === 0 && tieBreak(p, best) < 0)) best = p;
  }
  return best;
}

// add the context switch block if the CPU is moving to a different process
// returns the new time
function contextSwitch(gantt, lastId, nextId, time, csTime) {
  if (lastId !== null && lastId !== nextId && csTime > 0) {
    addBlock(gantt, "CS", time, time + csTime);
    return time + csTime;
  }
  return time;
}

// count context switches = number of times the CPU went from one process straight to another
function countSwitches(gantt) {
  let count = 0;
  let last = null;
  for (const block of gantt) {
    if (block.id === "IDLE") {
      last = null; // after idle there is nothing to switch from
    } else if (block.id !== "CS") {
      if (last !== null && last !== block.id) count++;
      last = block.id;
    }
  }
  return count;
}

// work out completion, turnaround, waiting and response time, and the averages
function buildResult(procs, gantt) {
  const rows = procs.map((p) => {
    const turnaround = p.completion - p.arrival; // TAT = CT - AT
    const waiting = turnaround - p.burst; // WT = TAT - BT
    const response = p.start - p.arrival; // RT = first time on CPU - AT
    return {
      id: p.id,
      arrival: p.arrival,
      burst: p.burst,
      priority: p.priority,
      completion: p.completion,
      turnaround: turnaround,
      waiting: waiting,
      response: response,
    };
  });

  const n = rows.length;
  const sum = (field) => rows.reduce((total, r) => total + r[field], 0);
  return {
    gantt: gantt,
    rows: rows,
    avgWaiting: sum("waiting") / n,
    avgTurnaround: sum("turnaround") / n,
    avgResponse: sum("response") / n,
    switches: countSwitches(gantt),
    totalTime: gantt[gantt.length - 1].end,
  };
}

// ---------- non-preemptive algorithms (FCFS, SJF, Priority) ----------
// Once a process gets the CPU it runs until it finishes.
// key decides which ready process goes next.
function nonPreemptive(processes, csTime, key) {
  const procs = copyProcesses(processes);
  const gantt = [];
  let time = 0;
  let done = 0;
  let lastId = null;

  while (done < procs.length) {
    // ready list = arrived and not finished
    const ready = procs.filter((p) => p.arrival <= time && p.remaining > 0);

    if (ready.length === 0) {
      // nothing has arrived yet, so the CPU is idle until the next arrival
      const next = Math.min(...procs.filter((p) => p.remaining > 0).map((p) => p.arrival));
      addBlock(gantt, "IDLE", time, next);
      time = next;
      lastId = null;
      continue;
    }

    const p = pickBest(ready, key);
    time = contextSwitch(gantt, lastId, p.id, time, csTime);

    p.start = time;
    addBlock(gantt, p.id, time, time + p.burst);
    time += p.burst;
    p.remaining = 0;
    p.completion = time;
    done++;
    lastId = p.id;
  }
  return buildResult(procs, gantt);
}

// ---------- preemptive algorithms (SRTF, Preemptive Priority) ----------
// Every time unit we check again which ready process should have the CPU,
// so a newly arrived process can take the CPU away from the running one.
function preemptive(processes, csTime, key) {
  const procs = copyProcesses(processes);
  const gantt = [];
  let time = 0;
  let done = 0;
  let lastId = null;

  while (done < procs.length) {
    const ready = procs.filter((p) => p.arrival <= time && p.remaining > 0);

    if (ready.length === 0) {
      addBlock(gantt, "IDLE", time, time + 1);
      time++;
      lastId = null;
      continue;
    }

    const p = pickBest(ready, key);
    time = contextSwitch(gantt, lastId, p.id, time, csTime);

    if (p.start === -1) p.start = time;
    addBlock(gantt, p.id, time, time + 1); // run for one time unit
    time++;
    p.remaining--;
    if (p.remaining === 0) {
      p.completion = time;
      done++;
    }
    lastId = p.id;
  }
  return buildResult(procs, gantt);
}

// ---------- the six algorithms ----------

// First Come First Served: earliest arrival first
export function fcfs(processes, csTime = 0) {
  return nonPreemptive(processes, csTime, (p) => p.arrival);
}

// Shortest Job First (non-preemptive): smallest burst first
export function sjf(processes, csTime = 0) {
  return nonPreemptive(processes, csTime, (p) => p.burst);
}

// Shortest Remaining Time First (preemptive SJF): smallest remaining time first
export function srtf(processes, csTime = 0) {
  return preemptive(processes, csTime, (p) => p.remaining);
}

// Priority (non-preemptive): smallest priority number first
export function priorityNP(processes, csTime = 0) {
  return nonPreemptive(processes, csTime, (p) => p.priority);
}

// Priority (preemptive): smallest priority number first, can take the CPU away
export function priorityP(processes, csTime = 0) {
  return preemptive(processes, csTime, (p) => p.priority);
}

// Round Robin: each process gets at most `quantum` time units, then goes to the back of the queue
export function roundRobin(processes, quantum, csTime = 0) {
  const procs = copyProcesses(processes);
  const order = [...procs].sort(tieBreak); // processes in arrival order
  const queue = [];
  const gantt = [];
  let time = 0;
  let done = 0;
  let next = 0; // index in `order` of the next process that has not arrived yet
  let lastId = null;

  // put every process that has arrived by `time` at the back of the ready queue
  function addArrivals() {
    while (next < order.length && order[next].arrival <= time) {
      queue.push(order[next]);
      next++;
    }
  }

  addArrivals();
  while (done < procs.length) {
    if (queue.length === 0) {
      // CPU idle until the next process arrives
      addBlock(gantt, "IDLE", time, order[next].arrival);
      time = order[next].arrival;
      lastId = null;
      addArrivals();
      continue;
    }

    const p = queue.shift();
    time = contextSwitch(gantt, lastId, p.id, time, csTime);
    addArrivals(); // processes that arrived during the context switch

    if (p.start === -1) p.start = time;
    const run = Math.min(quantum, p.remaining);
    addBlock(gantt, p.id, time, time + run);
    time += run;
    p.remaining -= run;

    // new arrivals join the queue before the process that was just preempted
    addArrivals();
    if (p.remaining > 0) {
      queue.push(p);
    } else {
      p.completion = time;
      done++;
    }
    lastId = p.id;
  }
  return buildResult(procs, gantt);
}

// list used by the GUI for the drop-down and the comparison
export const ALGORITHMS = [
  { key: "fcfs", name: "FCFS", run: (procs, q, cs) => fcfs(procs, cs) },
  { key: "sjf", name: "SJF (non-preemptive)", run: (procs, q, cs) => sjf(procs, cs) },
  { key: "srtf", name: "SRTF (preemptive SJF)", run: (procs, q, cs) => srtf(procs, cs) },
  { key: "rr", name: "Round Robin", run: (procs, q, cs) => roundRobin(procs, q, cs) },
  { key: "pnp", name: "Priority (non-preemptive)", run: (procs, q, cs) => priorityNP(procs, cs) },
  { key: "pp", name: "Priority (preemptive)", run: (procs, q, cs) => priorityP(procs, cs) },
];
