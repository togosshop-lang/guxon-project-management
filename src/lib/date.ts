function localIso(d: Date) {
  const y=d.getFullYear()
  const m=String(d.getMonth()+1).padStart(2,'0')
  const day=String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

export function addDays(isoDate: string | null | undefined, days: number): string | null {
  if (!isoDate) return null
  const [y,m,d]=isoDate.split('-').map(Number)
  const date=new Date(y,m-1,d)
  date.setDate(date.getDate()+days)
  return localIso(date)
}

export function dLabel(n: number | null) {
  if (n === null || n === undefined) return ''
  return n === 0 ? 'D0' : n > 0 ? `D+${n}` : `D${n}`
}

export function todayIso() { return localIso(new Date()) }

export function daysFromToday(iso: string) {
  const [ty,tm,td]=todayIso().split('-').map(Number)
  const [y,m,d]=iso.split('-').map(Number)
  const a=new Date(ty,tm-1,td).getTime()
  const b=new Date(y,m-1,d).getTime()
  return Math.round((b-a)/86400000)
}
