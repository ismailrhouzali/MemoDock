import { DatabaseColumn, DatabaseRow } from '../db/types';

export type AggregationType = 'none' | 'count' | 'sum' | 'avg' | 'min' | 'max' | 'checked';

/**
 * Safely evaluates a basic arithmetic expression (numbers, +, -, *, /, parentheses).
 */
function evaluateArithmetic(expr: string): number | null {
  const sanitized = expr.replace(/\s+/g, '');
  if (!sanitized || !/^[0-9+\-*/().]+$/.test(sanitized)) return null;
  try {
    // Tokenize numbers and operators
    const tokens: (number | string)[] = [];
    let numBuf = '';
    for (let i = 0; i < sanitized.length; i++) {
      const ch = sanitized[i];
      if (/[0-9.]/.test(ch) || (ch === '-' && (i === 0 || '+-*/('.includes(sanitized[i - 1])))) {
        numBuf += ch;
      } else {
        if (numBuf) {
          tokens.push(parseFloat(numBuf));
          numBuf = '';
        }
        tokens.push(ch);
      }
    }
    if (numBuf) tokens.push(parseFloat(numBuf));

    // Recursive descent parser
    let pos = 0;
    const parseExpr = (): number => {
      let left = parseTerm();
      while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
        const op = tokens[pos++];
        const right = parseTerm();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    };
    const parseTerm = (): number => {
      let left = parseFactor();
      while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
        const op = tokens[pos++];
        const right = parseFactor();
        left = op === '*' ? left * right : right === 0 ? NaN : left / right;
      }
      return left;
    };
    const parseFactor = (): number => {
      if (tokens[pos] === '(') {
        pos++;
        const val = parseExpr();
        if (tokens[pos] === ')') pos++;
        return val;
      }
      const val = tokens[pos++];
      return typeof val === 'number' ? val : NaN;
    };

    const res = parseExpr();
    return Number.isFinite(res) ? Math.round(res * 10000) / 10000 : null;
  } catch {
    return null;
  }
}

/**
 * Evaluates Excel-like formulas starting with "=":
 * - =SUM(ColName) / =AVG(ColName) / =MIN(ColName) / =MAX(ColName) / =COUNT(ColName)
 * - Row arithmetic referencing column names: =Price * Qty + 10
 */
export function evaluateCellFormula(
  rawValue: string,
  row: DatabaseRow,
  columns: DatabaseColumn[],
  allRows: DatabaseRow[]
): string {
  if (!rawValue.startsWith('=')) return rawValue;
  const body = rawValue.slice(1).trim();
  if (!body) return '';

  // 1. Column aggregate functions: SUM(Col), AVG(Col), MIN(Col), MAX(Col), COUNT(Col)
  const aggMatch = body.match(/^(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\((.+)\)$/i);
  if (aggMatch) {
    const fn = aggMatch[1].toUpperCase();
    const targetName = aggMatch[2].trim().replace(/^["']|["']$/g, '').toLowerCase();
    const targetCol = columns.find((c) => c.name.toLowerCase() === targetName);
    if (!targetCol) return '#COL?';

    const nums = allRows
      .map((r) => Number(r.cells[targetCol.id]))
      .filter((n) => !isNaN(n) && String(n) !== '');

    if (fn === 'COUNT') {
      return String(allRows.filter((r) => String(r.cells[targetCol.id] ?? '').trim() !== '').length);
    }
    if (nums.length === 0) return '0';
    if (fn === 'SUM') return String(Math.round(nums.reduce((a, b) => a + b, 0) * 10000) / 10000);
    if (fn === 'AVG' || fn === 'AVERAGE') {
      return String(Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10000) / 10000);
    }
    if (fn === 'MIN') return String(Math.min(...nums));
    if (fn === 'MAX') return String(Math.max(...nums));
  }

  // 2. Replace column names in the expression with current row's numeric values
  let expr = body;
  const sortedCols = [...columns].sort((a, b) => b.name.length - a.name.length);
  for (const col of sortedCols) {
    if (!col.name) continue;
    const escaped = col.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const cellVal = Number(row.cells[col.id]);
    expr = expr.replace(regex, isNaN(cellVal) ? '0' : String(cellVal));
  }

  const evaluated = evaluateArithmetic(expr);
  return evaluated !== null ? String(evaluated) : '#ERR';
}

/**
 * Computes column-level footer aggregation (Excel/Notion status footer).
 */
export function computeColumnAggregation(
  col: DatabaseColumn,
  rows: DatabaseRow[],
  type: AggregationType
): string {
  if (type === 'none') return '';
  if (type === 'count') {
    const filled = rows.filter((r) => {
      const v = r.cells[col.id];
      return Array.isArray(v) ? v.length > 0 : String(v ?? '').trim() !== '';
    }).length;
    return `Count: ${filled}`;
  }
  if (type === 'checked') {
    const checked = rows.filter((r) => Boolean(r.cells[col.id])).length;
    const pct = rows.length ? Math.round((checked / rows.length) * 100) : 0;
    return `${pct}% (${checked}/${rows.length})`;
  }
  const nums = rows
    .map((r) => Number(r.cells[col.id]))
    .filter((n) => rIsFinite(n, rows, col.id));
  if (nums.length === 0) return `${type.toUpperCase()}: —`;
  if (type === 'sum') return `Sum: ${Math.round(nums.reduce((a, b) => a + b, 0) * 100) / 100}`;
  if (type === 'avg') return `Avg: ${Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100}`;
  if (type === 'min') return `Min: ${Math.min(...nums)}`;
  if (type === 'max') return `Max: ${Math.max(...nums)}`;
  return '';
}

function rIsFinite(n: number, _rows: DatabaseRow[], _colId: string): boolean {
  return Number.isFinite(n);
}
