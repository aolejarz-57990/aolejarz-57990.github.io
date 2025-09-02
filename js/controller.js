import { Store } from './dataStore.js';
import { initUI, render } from './ui.js';

const store = new Store();

// Grant UI read-only access to state
initUI(() => store.getState());

// Re-render on any store change
store.addEventListener('change', () => render());

// Initial paint
render();

/* ---------- UI intents ---------- */
document.addEventListener('ui:filters-changed', render);

document.addEventListener('ui:task-create', (e) => {
  store.addTask(e.detail);
});
document.addEventListener('ui:task-update', (e) => {
  store.updateTask(e.detail.id, e.detail.data);
});
document.addEventListener('ui:task-delete', (e) => {
  if (confirm('Usunąć zadanie?')) store.deleteTask(e.detail.id);
});
document.addEventListener('ui:task-to-sprint', (e) => {
  store.moveTaskToSprint(e.detail.id);
});
document.addEventListener('ui:task-move', (e) => {
  store.moveTaskToStatus(e.detail.id, e.detail.status);
});

// Sprint
document.addEventListener('ui:sprint-set', (e) => {
  store.setSprint(e.detail);
});
document.addEventListener('ui:sprint-toggle', () => {
  const ok = store.toggleSprint();
  if (!ok) alert('Najpierw zaplanuj sprint.');
});

// Standups
document.addEventListener('ui:standup-add', (e) => {
  store.addStandup(e.detail);
});

// Import / Export
document.addEventListener('ui:export', () => {
  const blob = new Blob([store.exportJSON()], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `scrum-board-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

document.addEventListener('ui:import', (e) => {
  try {
    const data = JSON.parse(e.detail.json);
    store.replaceState(data);
  } catch (err) {
    alert('Nieprawidłowy plik JSON.');
  }
});

// Optional: keep burndown fresh during active sprint
setInterval(() => {
  const s = store.getState().sprint;
  if (s.started) { s.history = s.history || []; store.recalcBurndown(); store.save(); }
}, 30000);
