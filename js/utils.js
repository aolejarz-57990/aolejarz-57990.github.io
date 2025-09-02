export const uid = () => Math.random().toString(36).slice(2, 9);
export const todayISO = () => {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
};
export const fmtDate = d => new Date(d).toLocaleDateString();
export const unique = list => [...new Set(list)].filter(Boolean).sort((a,b)=>a.localeCompare(b));
