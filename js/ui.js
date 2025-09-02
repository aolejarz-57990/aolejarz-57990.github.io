// js/ui.js
import { fmtDate, unique } from './utils.js';

const qs  = sel => document.querySelector(sel);
const byId = id => document.getElementById(id);

// --- referencje do DOM ---
const refs = {
  backlog:    byId('backlog'),
  search:     byId('search'),
  assignee:   byId('assigneeFilter'),
  tag:        byId('tagFilter'),
  columns: {
    todo:       qs('.dropzone[data-status="todo"]'),
    inprogress: qs('.dropzone[data-status="inprogress"]'),
    review:     qs('.dropzone[data-status="review"]'),
    done:       qs('.dropzone[data-status="done"]')
  },
  counts: {
    todo:        byId('count-todo'),
    inprogress:  byId('count-inprogress'),
    review:      byId('count-review'),
    done:        byId('count-done')
  },
  burndown:    byId('burndown'),
  sprintInfo:  byId('sprintInfo'),
  dialogs: {
    task:       byId('taskDialog'),
    sprint:     byId('sprintDialog')
  },
  forms: {
    task:       byId('taskForm'),
    sprint:     byId('sprintForm'),
    standup:    byId('standupForm')
  },
  standupList: byId('standupList'),
  buttons: {
    newTask:    byId('newTaskBtn'),
    planSprint: byId('planSprintBtn'),
    startStop:  byId('startStopSprintBtn'),
    exportBtn:  byId('exportBtn'),
    importBtn:  byId('importBtn')
  }
};

let _stateAccess = () => ({ tasks: [], sprint: {}, standups: {} });
let _editingId = null;

function dispatch(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

// --- filtrowanie backlogu ---
function matchesFilters(task) {
  const q  = refs.search.value.trim().toLowerCase();
  const fa = refs.assignee.value;
  const ft = refs.tag.value;
  const inText = (task.title + ' ' + (task.tags||[]).join(' ') + ' ' + (task.assignee||'')).toLowerCase();
  const qOk = !q || inText.includes(q);
  const aOk = !fa || task.assignee === fa;
  const tOk = !ft || (task.tags||[]).includes(ft);
  return qOk && aOk && tOk;
}

// --- karta zadania ---
function taskCard(task, { draggable=false, showMove=false } = {}) {
  const el = document.createElement('div');
  el.className = 'task';
  el.draggable = draggable;
  el.dataset.id = task.id;
  el.innerHTML = `
    <div class="title">${task.title}</div>
    <div class="muted">${task.desc || ''}</div>
    <div class="meta">
      <span class="chip points">★ ${task.points||0} SP</span>
      ${task.assignee? `<span class="chip assignee">👤 ${task.assignee}</span>`: ``}
      ${(task.tags||[]).map(t=>`<span class="chip">#${t}</span>`).join('')}
    </div>
    <div class="row" style="margin-top:6px">
      ${showMove? `<button class="btn" data-act="toSprint">➟ Do sprintu</button>`:""}
      <button class="btn" data-act="edit">✎ Edytuj</button>
      <button class="btn" data-act="delete">🗑 Usuń</button>
    </div>
  `;

  // drag & drop
  el.addEventListener('dragstart', e => {
    el.classList.add('dragging');
    e.dataTransfer.setData('text/plain', task.id);
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));

  // akcje przycisków
  el.addEventListener('click', (e)=>{
    const act = e.target?.dataset?.act;
    if (!act) return;
    if (act === 'toSprint') dispatch('ui:task-to-sprint', { id: task.id });
    if (act === 'edit')     openTaskDialog(task);
    if (act === 'delete')   dispatch('ui:task-delete', { id: task.id });
  });

  return el;
}

// --- render backlogu i filtrów ---
function renderFilters(tasks) {
  const assignees = unique(tasks.map(t=>t.assignee));
  refs.assignee.innerHTML = '<option value="">— Wszyscy —</option>' + assignees.map(a=>`<option>${a}</option>`).join('');
  const tags = unique(tasks.flatMap(t=>t.tags||[]));
  refs.tag.innerHTML = '<option value="">— Wszystkie tagi —</option>' + tags.map(t=>`<option>${t}</option>`).join('');
}

function renderBacklog(state) {
  renderFilters(state.tasks);
  const items = state.tasks.filter(t=>!t.inSprint).filter(matchesFilters);
  refs.backlog.innerHTML = items.length ? '' : `<div class="muted">Brak pozycji w backlogu. Dodaj zadanie ➕</div>`;
  for (const t of items) refs.backlog.appendChild(taskCard(t, { showMove:true }));
}

// --- render tablicy sprintu ---
function renderBoard(state) {
  Object.values(refs.columns).forEach(dz => dz.innerHTML = '');
  const inSprint = state.tasks.filter(t=>t.inSprint);
  const byStatus = s => inSprint.filter(t=> (t.status||'todo')===s).filter(matchesFilters);
  const order = ['todo','inprogress','review','done'];
  for (const s of order) {
    const list = byStatus(s);
    refs.counts[s].textContent = `${list.length} zadań`;
    for (const t of list) refs.columns[s].appendChild(taskCard(t, { draggable:true }));
  }
}

// --- sprint badge ---
function renderSprintBadge(state) {
  const s = state.sprint;
  if (!s.start || !s.end) {
    refs.sprintInfo.textContent = 'Brak aktywnego sprintu';
    refs.buttons.startStop.textContent = '▶️ Start sprintu';
    return;
  }
  const txt = `${s.name} • ${fmtDate(s.start)} → ${fmtDate(s.end)} ${s.started? '• Aktywny' : '• Zaplanowany'}`;
  refs.sprintInfo.textContent = txt;
  refs.buttons.startStop.textContent = s.started? '⏸ Zatrzymaj sprint' : '▶️ Start sprintu';
}

// --- burndown ---
function drawBurndown(state) {
  const canvas = refs.burndown;
  const ctx = canvas.getContext('2d');
  const w = canvas.width  = canvas.clientWidth * devicePixelRatio;
  const h = canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx.clearRect(0,0,w,h);

  const { start, end, history } = state.sprint;
  if (!start || !end) {
    ctx.fillStyle = "#9aa3d9"; ctx.font = `${14*devicePixelRatio}px system-ui`;
    ctx.fillText("Skonfiguruj sprint, aby zobaczyć burndown.", 16, 24);
    return;
  }

  const s = new Date(start); s.setHours(0,0,0,0);
  const e = new Date(end);   e.setHours(0,0,0,0);
  const days = [];
  for (let d=new Date(s); d<=e; d.setDate(d.getDate()+1)) days.push(d.toISOString().slice(0,10));

  const total = state.tasks.filter(t=>t.inSprint).reduce((a,b)=>a+(+b.points||0),0);
  const ideal = days.map((_,i)=> total - i*(total/(days.length-1||1)));
  const histMap = Object.fromEntries((history||[]).map(h=>[h.date, h.remaining]));
  const actual = [];
  let lastVal = total;
  for (let i=0;i<days.length;i++) {
    const d = days[i];
    if (d in histMap) { lastVal = histMap[d]; }
    actual.push(lastVal);
  }

  const pad=40, x0=pad, y0=h-pad, x1=w-pad, y1=pad;
  ctx.strokeStyle="#2a2f5a"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(x0,y1); ctx.lineTo(x0,y0); ctx.lineTo(x1,y0); ctx.stroke();

  const maxY = Math.max(total, ...ideal, ...actual);
  const x = i => x0 + (i/(days.length-1||1))*(x1-x0);
  const y = v => y0 - (v/(maxY||1))*(y0-y1);

  ctx.beginPath(); ctx.moveTo(x(0), y(ideal[0]||0));
  for (let i=1;i<ideal.length;i++) ctx.lineTo(x(i), y(ideal[i]));
  ctx.setLineDash([8*devicePixelRatio,6*devicePixelRatio]); ctx.strokeStyle="#6b8afd"; ctx.lineWidth=2; ctx.stroke(); ctx.setLineDash([]);

  ctx.beginPath(); ctx.moveTo(x(0), y(actual[0]||0));
  for (let i=1;i<actual.length;i++) ctx.lineTo(x(i), y(actual[i]));
  ctx.strokeStyle="#34d399"; ctx.lineWidth=3; ctx.stroke();

  ctx.fillStyle="#9aa3d9"; ctx.font = `${12*devicePixelRatio}px system-ui`;
  ctx.fillText("Story Points", 4, y1-8);
  ctx.fillText("Dni", x1-20*devicePixelRatio, y0+16*devicePixelRatio);
}

// --- stand-up ---
function renderStandups(state) {
  const today = new Date(); today.setHours(0,0,0,0);
  const key = today.toISOString().slice(0,10);
  const items = state.standups[key] || [];
  refs.standupList.innerHTML = items.map(i=>`
    <div class="standup-item">
      <div><strong>${i.who}</strong> <span class="muted">(${new Date(i.at).toLocaleTimeString()})</span></div>
      <div class="muted">Wczoraj:</div><div>${i.y||"-"}</div>
      <div class="muted">Dziś:</div><div>${i.t||"-"}</div>
      <div class="muted">Blokery:</div><div class="${i.b?'':'muted'}">${i.b||"—"}</div>
    </div>
  `).join('') || `<div class="muted">Brak notatek na dziś.</div>`;
}

// --- obsługa UI ---
function wireStaticListeners() {
  [refs.search, refs.assignee, refs.tag].forEach(el =>
    el.addEventListener('input', () => dispatch('ui:filters-changed')));

  refs.buttons.newTask.addEventListener('click', () => openTaskDialog());
  refs.buttons.planSprint.addEventListener('click', () => openSprintDialog());
  refs.buttons.startStop.addEventListener('click', () => dispatch('ui:sprint-toggle'));
  refs.buttons.exportBtn.addEventListener('click', () => dispatch('ui:export'));
  refs.buttons.importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type='file'; input.accept='application/json';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => dispatch('ui:import', { json: reader.result });
      reader.readAsText(file);
    };
    input.click();
  });

  Object.values(refs.columns).forEach(dz => {
    dz.addEventListener('dragover', e=>{ e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave', ()=> dz.classList.remove('over'));
    dz.addEventListener('drop', e=>{
      e.preventDefault(); dz.classList.remove('over');
      const id = e.dataTransfer.getData('text/plain');
      dispatch('ui:task-move', { id, status: dz.dataset.status });
    });
  });

  refs.dialogs.task.addEventListener('close', ()=>{
    if (refs.dialogs.task.returnValue !== 'save') return;
    const payload = {
      title: byId('tTitle').value.trim(),
      desc: byId('tDesc').value.trim(),
      points: Number(byId('tPoints').value||0),
      assignee: byId('tAssignee').value.trim(),
      tags: byId('tTags').value.split(',').map(s=>s.trim()).filter(Boolean)
    };
    if (_editingId) {
      dispatch('ui:task-update', { id: _editingId, data: payload });
    } else {
      dispatch('ui:task-create', payload);
    }
    _editingId = null;
  });

  refs.dialogs.sprint.addEventListener('close', ()=>{
    if (refs.dialogs.sprint.returnValue !== 'save') return;
    const data = {
      name:  byId('sName').value.trim() || 'Sprint',
      start: byId('sStart').value,
      end:   byId('sEnd').value
    };
    dispatch('ui:sprint-set', data);
  });

  refs.forms.standup.addEventListener('submit', e=>{
    e.preventDefault();
    const item = {
      who: byId('suWho').value.trim(),
      y: byId('suYesterday').value.trim(),
      t: byId('suToday').value.trim(),
      b: byId('suBlockers').value.trim(),
    };
    dispatch('ui:standup-add', item);
    refs.forms.standup.reset();
  });
}

// --- otwieranie dialogów ---
export function openTaskDialog(task) {
  _editingId = task?.id || null;
  byId('taskDialogTitle').textContent = _editingId? 'Edytuj zadanie' : 'Nowe zadanie';
  byId('tTitle').value   = task?.title || '';
  byId('tDesc').value    = task?.desc || '';
  byId('tPoints').value  = task?.points ?? 1;
  byId('tAssignee').value= task?.assignee || '';
  byId('tTags').value    = (task?.tags||[]).join(', ');
  refs.dialogs.task.showModal();
}

export function openSprintDialog() {
  const s = _stateAccess().sprint;
  byId('sName').value  = s.name || '';
  byId('sStart').value = s.start || '';
  byId('sEnd').value   = s.end || '';
  refs.dialogs.sprint.showModal();
}

// --- API publiczne UI ---
export function initUI(stateAccessor) {
  _stateAccess = stateAccessor;
  wireStaticListeners();
}

export function render() {
  const state = _stateAccess();
  renderBacklog(state);
  renderBoard(state);
  renderStandups(state);
  renderSprintBadge(state);
  drawBurndown(state);
}
