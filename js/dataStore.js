import { uid, todayISO } from './utils.js';

const STORE_KEY = 'scrum-board-v2';

const DEFAULT_STATE = {
  tasks: [], // {id, title, desc, points, assignee, tags[], status, inSprint}
  sprint: { name: 'Brak sprintu', start: null, end: null, started: false, history: [] },
  standups: {} // dateISO -> [{who, y, t, b, at}]
};

export class Store extends EventTarget {
  constructor() {
    super();
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || DEFAULT_STATE;
    this.state = saved;

    // Seed starter data if empty
    if (this.state.tasks.length === 0) {
      this.state.tasks.push(
        {id: uid(), title:"Setup repo i CI", desc:"Repo Git + workflow", points:3, assignee:"Ola", tags:["devops"], status:"todo", inSprint:false},
        {id: uid(), title:"Landing page", desc:"Sekcja hero + CTA", points:5, assignee:"Kamil", tags:["frontend"], status:"todo", inSprint:false},
        {id: uid(), title:"Endpoint /auth/login", desc:"JWT + walidacja", points:8, assignee:"Ania", tags:["api","backend"], status:"todo", inSprint:false}
      );
      this.save();
    }
  }

  _emit() { this.dispatchEvent(new Event('change')); }
  save() { localStorage.setItem(STORE_KEY, JSON.stringify(this.state)); this._emit(); }

  // ---------- Queries ----------
  getState() { return this.state; }

  pointsRemaining() {
    return this.state.tasks
      .filter(t => t.inSprint && t.status !== 'done')
      .reduce((a,b) => a + (Number(b.points)||0), 0);
  }

  // ---------- Mutations ----------
  addTask(data) {
    this.state.tasks.push({ id: uid(), status: 'todo', inSprint: false, tags: [], ...data });
    this.save();
  }
  updateTask(id, data) {
    const t = this.state.tasks.find(x => x.id === id);
    if (!t) return;
    Object.assign(t, data);
    this.save();
  }
  deleteTask(id) {
    const i = this.state.tasks.findIndex(x => x.id === id);
    if (i >= 0) { this.state.tasks.splice(i,1); this.save(); }
  }
  moveTaskToStatus(id, status) {
    const t = this.state.tasks.find(x => x.id === id);
    if (!t) return;
    t.status = status;
    t.inSprint = true;
    this.recalcBurndown(); // update history if sprint active
    this.save();
  }
  moveTaskToSprint(id) {
    const t = this.state.tasks.find(x => x.id === id);
    if (!t) return;
    t.inSprint = true;
    t.status = t.status || 'todo';
    this.save();
  }

  setSprint({ name, start, end }) {
    this.state.sprint.name = name || 'Sprint';
    this.state.sprint.start = start;
    this.state.sprint.end = end;
    this.state.sprint.started = false;
    this.state.sprint.history = [];
    this.save();
  }

  toggleSprint() {
    const s = this.state.sprint;
    if (!s.start || !s.end) return false;
    s.started = !s.started;
    if (s.started) {
      s.history = [];
      this.recalcBurndown();
    }
    this.save();
    return s.started;
  }

  recalcBurndown() {
    const s = this.state.sprint;
    if (!s.start || !s.end || !s.started) return;
    const today = todayISO();
    const remaining = this.pointsRemaining();
    const last = s.history[s.history.length - 1];
    if (!last || last.date !== today) {
      s.history.push({ date: today, remaining });
    } else {
      last.remaining = remaining;
    }
  }

  addStandup({ who, y, t, b }) {
    const key = todayISO();
    this.state.standups[key] = this.state.standups[key] || [];
    this.state.standups[key].push({ who, y, t, b, at: new Date().toISOString() });
    this.save();
  }

  replaceState(newState) {
    this.state = newState;
    this.save();
  }

  exportJSON() {
    return JSON.stringify(this.state, null, 2);
  }
}
