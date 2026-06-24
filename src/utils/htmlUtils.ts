export function esc(s: string): string {
  return (s || '').replace(/[&<>]/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m] || m
  );
}

export function md(t: string): string {
  let s = esc(t);
  s = s
    .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/^- (.*)$/gm, '<li>$1</li>');
  s = s.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  return s.replace(/\n/g, '<br>');
}

export function mdToHtml(t: string): string {
  return md(t);
}

export function htmlEscape(s: string): string {
  return esc(s);
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatDate(): string {
  return new Date().toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
  });
}

export function formatDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString('es-CL');
}

export function toast(msg: string, type?: string): void {
  const c = document.getElementById('toast-container') || (() => {
    const e = document.createElement('div');
    e.className = 'toast-container';
    e.id = 'toast-container';
    document.body.appendChild(e);
    return e;
  })();
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '') + ' ';
  t.onclick = () => t.remove();
  const icons: Record<string, string> = { ok: 'check-circle', err: 'alert-circle', warn: 'alert-triangle' };
  const iconKey = type || '';
  t.innerHTML = (icons[iconKey] ? '<span class="t-icon"><i data-lucide="' + icons[iconKey] + '" style="width:16px;height:16px"></i></span>' : '') +
    '<span>' + esc(msg) + '</span>';
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}
