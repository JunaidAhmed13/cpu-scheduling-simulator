# CPU Scheduling Simulator

Operating Systems (CSC 320) semester project, BS(CS)-5B, Bahria University Islamabad.

Group members:
- Muhammad Sadiq Aslam Khan (01-134242-091)
- Malik Junaid Ahmed (01-134242-061)
- Bilawal Khokhar (01-134242-036)

## What it does

It simulates these CPU scheduling algorithms:

- FCFS (First Come First Served)
- SJF (Shortest Job First, non-preemptive)
- SRTF (Shortest Remaining Time First, the preemptive form of SJF)
- Round Robin (with a time quantum you choose)
- Priority, both non-preemptive and preemptive (lower number = higher priority)

For each run it shows a Gantt chart and the completion, turnaround, waiting and response time of every process, along with the averages and the number of context switches. **Compare all algorithms** runs all six on the same input and draws a bar chart.

**Our own feature:** you can set a *context switch time*. Each time the CPU moves from one process to a different one, that much time is added and appears as a `CS` block on the Gantt chart, so you can see how the overhead raises waiting and turnaround times (most of all in Round Robin).

## How to run

You need Node.js 18 or newer.

```
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

To check the simulator against our hand-worked answers:

```
npm test
```

## Files

| File | What it has |
|---|---|
| `src/scheduler.js` | All the scheduling algorithms and the time calculations |
| `src/App.jsx` | The GUI: input table, settings, Gantt chart, results and comparison |
| `src/styles.css` | Page styling |
| `tests/check.mjs` | 14 test cases that compare the simulator with answers we worked out by hand |
