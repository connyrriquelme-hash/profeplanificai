export function StatusBar({ message, type: t = '' }: { message: string; type?: string }) {
  if (!message) return null;
  const cls = ['ok', 'warn', 'bad'].includes(t) ? t : '';
  return <div className={`status ${cls}`}>{message}</div>;
}
