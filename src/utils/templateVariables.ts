/**
 * Resolves dynamic template placeholders such as {{date}}, {{time}}, {{datetime}}, and {{title}}.
 */
export function resolveTemplateVariables(
  input: string,
  title = 'Untitled Note',
  now: Date = new Date()
): string {
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const datetimeStr = `${dateStr} ${timeStr}`;

  return input
    .replace(/\{\{\s*date\s*\}\}/gi, dateStr)
    .replace(/\{\{\s*time\s*\}\}/gi, timeStr)
    .replace(/\{\{\s*datetime\s*\}\}/gi, datetimeStr)
    .replace(/\{\{\s*title\s*\}\}/gi, title);
}
