// App.jsx - the GUI. It takes the input, calls scheduler.js and shows the results.
import { useState } from "react";
import { ALGORITHMS } from "./scheduler.js";

// sample input (same as test set A in the report)
const SAMPLE = [
  { id: "P1", arrival: 0, burst: 5, priority: 3 },
  { id: "P2", arrival: 1, burst: 3, priority: 2 },
  { id: "P3", arrival: 2, burst: 8, priority: 1 },
  { id: "P4", arrival: 3, burst: 6, priority: 4 },
];

// one colour per process in the Gantt chart
const COLORS = ["#4e79a7", "#f28e2b", "#59a14f", "#e15759", "#76b7b2", "#edc948", "#b07aa1", "#9c755f"];

function colorOf(id) {
  if (id === "IDLE") return "#e0e0e0";
  if (id === "CS") return "#555555";
  return COLORS[(parseInt(id.slice(1)) - 1) % COLORS.length];
}

export default function App() {
  const [rows, setRows] = useState(SAMPLE);
  const [algo, setAlgo] = useState("fcfs");
  const [quantum, setQuantum] = useState(2);
  const [csTime, setCsTime] = useState(0);
  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState("");

  // change one cell of the input table
  function updateCell(i, field, value) {
    const copy = rows.map((r) => ({ ...r }));
    copy[i][field] = value;
    setRows(copy);
  }

  // add a new process row; ids stay P1, P2, P3 ...
  function addRow() {
    setRows([...rows, { id: "P" + (rows.length + 1), arrival: 0, burst: 1, priority: 1 }]);
  }

  function removeRow(i) {
    const left = rows.filter((_, j) => j !== i);
    setRows(left.map((r, j) => ({ ...r, id: "P" + (j + 1) })));
  }

  // check the input and turn the text boxes into numbers; returns null if something is wrong
  function readInput() {
    if (rows.length === 0) return fail("Add at least one process.");
    const procs = [];
    for (const r of rows) {
      const arrival = Number(r.arrival);
      const burst = Number(r.burst);
      const priority = Number(r.priority);
      if (!Number.isInteger(arrival) || arrival < 0) return fail(`${r.id}: arrival time must be a whole number 0 or more.`);
      if (!Number.isInteger(burst) || burst < 1) return fail(`${r.id}: burst time must be a whole number 1 or more.`);
      if (!Number.isInteger(priority)) return fail(`${r.id}: priority must be a whole number.`);
      procs.push({ id: r.id, arrival, burst, priority });
    }
    if (!Number.isInteger(Number(quantum)) || Number(quantum) < 1) return fail("Time quantum must be a whole number 1 or more.");
    if (!Number.isInteger(Number(csTime)) || Number(csTime) < 0) return fail("Context switch time must be a whole number 0 or more.");
    setError("");
    return procs;
  }

  function fail(message) {
    setError(message);
    return null;
  }

  // run the selected algorithm
  function run() {
    const procs = readInput();
    if (!procs) return;
    const a = ALGORITHMS.find((x) => x.key === algo);
    setResult({ name: a.name, ...a.run(procs, Number(quantum), Number(csTime)) });
    setComparison(null);
  }

  // run all six algorithms on the same input and compare the averages
  function compareAll() {
    const procs = readInput();
    if (!procs) return;
    setComparison(ALGORITHMS.map((a) => ({ name: a.name, ...a.run(procs, Number(quantum), Number(csTime)) })));
    setResult(null);
  }

  return (
    <div className="page">
      <h1>CPU Scheduling Simulator</h1>

      {/* ---------- input ---------- */}
      <div className="card">
        <h2>Processes</h2>
        <table>
          <thead>
            <tr><th>Process</th><th>Arrival time</th><th>Burst time</th><th>Priority</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.id}</td>
                <td><input value={r.arrival} onChange={(e) => updateCell(i, "arrival", e.target.value)} /></td>
                <td><input value={r.burst} onChange={(e) => updateCell(i, "burst", e.target.value)} /></td>
                <td><input value={r.priority} onChange={(e) => updateCell(i, "priority", e.target.value)} /></td>
                <td><button className="small" onClick={() => removeRow(i)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="buttons">
          <button onClick={addRow}>Add process</button>
          <button onClick={() => setRows(SAMPLE)}>Load sample</button>
          <button onClick={() => setRows([])}>Clear</button>
        </div>
        <p className="note">Lower priority number = higher priority.</p>

        <h2>Settings</h2>
        <div className="settings">
          <label>Algorithm
            <select value={algo} onChange={(e) => setAlgo(e.target.value)}>
              {ALGORITHMS.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
            </select>
          </label>
          <label>Time quantum (Round Robin)
            <input value={quantum} onChange={(e) => setQuantum(e.target.value)} />
          </label>
          <label>Context switch time
            <input value={csTime} onChange={(e) => setCsTime(e.target.value)} />
          </label>
        </div>
        <div className="buttons">
          <button className="main" onClick={run}>Run</button>
          <button className="main" onClick={compareAll}>Compare all algorithms</button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      {/* ---------- result of one algorithm ---------- */}
      {result && (
        <div className="card">
          <h2>{result.name}</h2>
          <Gantt gantt={result.gantt} />
          <table>
            <thead>
              <tr><th>Process</th><th>Arrival</th><th>Burst</th><th>Priority</th><th>Completion</th>
                <th>Turnaround</th><th>Waiting</th><th>Response</th></tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td><td>{r.arrival}</td><td>{r.burst}</td><td>{r.priority}</td><td>{r.completion}</td>
                  <td>{r.turnaround}</td><td>{r.waiting}</td><td>{r.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="averages">
            <span>Average waiting time: <b>{result.avgWaiting.toFixed(2)}</b></span>
            <span>Average turnaround time: <b>{result.avgTurnaround.toFixed(2)}</b></span>
            <span>Average response time: <b>{result.avgResponse.toFixed(2)}</b></span>
            <span>Context switches: <b>{result.switches}</b></span>
            <span>Total time: <b>{result.totalTime}</b></span>
          </div>
        </div>
      )}

      {/* ---------- comparison of all algorithms ---------- */}
      {comparison && (
        <div className="card">
          <h2>Comparison (same input)</h2>
          <table>
            <thead>
              <tr><th>Algorithm</th><th>Avg waiting</th><th>Avg turnaround</th><th>Avg response</th>
                <th>Context switches</th><th>Total time</th></tr>
            </thead>
            <tbody>
              {comparison.map((c) => (
                <tr key={c.name}>
                  <td>{c.name}</td><td>{c.avgWaiting.toFixed(2)}</td><td>{c.avgTurnaround.toFixed(2)}</td>
                  <td>{c.avgResponse.toFixed(2)}</td><td>{c.switches}</td><td>{c.totalTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <BarChart data={comparison} />
        </div>
      )}
    </div>
  );
}

// Gantt chart: each block's width is proportional to how long it ran
function Gantt({ gantt }) {
  const total = gantt[gantt.length - 1].end;
  return (
    <div className="gantt">
      <div className="gantt-row">
        {gantt.map((b, i) => (
          <div key={i} className="block" title={`${b.id}: ${b.start} to ${b.end}`}
            style={{ width: ((b.end - b.start) / total) * 100 + "%", background: colorOf(b.id),
              color: b.id === "IDLE" ? "#333" : "#fff" }}>
            {b.id}
          </div>
        ))}
      </div>
      <div className="gantt-times">
        {gantt.map((b, i) => (
          <span key={i} style={{ left: (b.start / total) * 100 + "%" }}>{b.start}</span>
        ))}
        <span style={{ left: "100%" }}>{total}</span>
      </div>
      <p className="note">Grey = CPU idle, dark grey CS = context switch.</p>
    </div>
  );
}

// simple bar chart of average waiting and turnaround time for every algorithm
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.avgTurnaround));
  return (
    <div className="chart">
      {data.map((d) => (
        <div key={d.name} className="chart-row">
          <div className="chart-label">{d.name}</div>
          <div className="chart-bars">
            <div className="bar wt" style={{ width: (d.avgWaiting / max) * 100 + "%" }}>{d.avgWaiting.toFixed(2)}</div>
            <div className="bar tat" style={{ width: (d.avgTurnaround / max) * 100 + "%" }}>{d.avgTurnaround.toFixed(2)}</div>
          </div>
        </div>
      ))}
      <p className="note"><span className="key wt"></span> Average waiting time &nbsp;
        <span className="key tat"></span> Average turnaround time</p>
    </div>
  );
}
