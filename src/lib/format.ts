export function fmtParams(n?: number | null): string {
  if (!n) return '—'
  if (n >= 1e12) return (n / 1e12).toFixed(n >= 1e13 ? 0 : 2).replace(/\.?0+$/, '') + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e11 ? 0 : 1).replace(/\.0$/, '') + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M'
  return String(n)
}

export function fmtCtx(n: number): string {
  if (n >= 1048576) return (n / 1048576).toFixed(n % 1048576 ? 1 : 0) + 'M'
  if (n >= 1000) return Math.round(n / 1024) + 'K'
  return String(n)
}

export function fmtTokens(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(Math.round(n))
}

export function fmtNum(n: number): string {
  return n.toLocaleString('en-US')
}

export function fmtUSD(n: number, digits = 2): string {
  if (n !== 0 && Math.abs(n) < 0.01) return '$' + n.toFixed(6).replace(/0+$/, '')
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function fmtPrice(perMillion: number): string {
  if (perMillion === 0) return '무료'
  return '$' + (perMillion < 0.1 ? perMillion.toFixed(3) : perMillion.toFixed(2))
}

export function fmtBytes(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + ' TB'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' GB'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' MB'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + ' KB'
  return n + ' B'
}

export function fmtDate(d: string | number | Date): string {
  const dt = new Date(d)
  return dt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function fmtDateTime(d: string | number | Date): string {
  const dt = new Date(d)
  return dt.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function timeAgo(d: string | number | Date): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return `${s}초 전`
  if (s < 3600) return `${Math.floor(s / 60)}분 전`
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}일 전`
  return fmtDate(d)
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)
}
