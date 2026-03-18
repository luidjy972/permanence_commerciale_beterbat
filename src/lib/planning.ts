import type { PlanningWeek, PlanningEntry } from '@/lib/types'

const WEEKDAYS = [
  { label: 'Lundi', offset: 0 },
  { label: 'Mardi', offset: 1 },
  { label: 'Mercredi', offset: 2 },
  { label: 'Jeudi', offset: 3 },
  { label: 'Vendredi', offset: 4 },
]

const SHIFTS = [
  { label: 'Matin', timeRange: '8H00 - 13H00' },
  { label: 'Après-midi', timeRange: '14H00 - 17H00' },
]

function toInputDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(dateString: string, dayCount: number): string {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + dayCount)
  return toInputDate(date)
}

function getISOWeekNumber(dateString: string): number {
  const date = new Date(`${dateString}T12:00:00`)
  const temp = new Date(date.getTime())
  temp.setUTCDate(temp.getUTCDate() + 4 - (temp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1))
  return Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function buildWeekEntries(
  week: { weekIndex: number; weekNumber: number; weekStart: string; weekEnd: string; offPerson: string; activePeople: string[] },
  weekOffset: number
): PlanningEntry[] {
  if (!week.activePeople.length) return []

  const monday = new Date(`${week.weekStart}T12:00:00`)

  return WEEKDAYS.flatMap((day, dayIndex) => {
    const currentDate = new Date(monday)
    currentDate.setDate(monday.getDate() + day.offset)

    return SHIFTS.map((shift, shiftIndex) => {
      const rotationIndex = dayIndex * SHIFTS.length + shiftIndex
      const assignee = week.activePeople[(rotationIndex + weekOffset) % week.activePeople.length]

      return {
        weekIndex: week.weekIndex,
        weekNumber: week.weekNumber,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        offPerson: week.offPerson,
        dayLabel: day.label,
        date: toInputDate(currentDate),
        shiftLabel: shift.label,
        timeRange: shift.timeRange,
        assignee,
      }
    })
  })
}

export function buildPlanning(
  weekStart: string,
  people: string[],
  startIndex: number,
  planningWeeks: number,
  rotationMode: 'weekly' | 'monthly',
  weekIndexOffset: number = 0
): PlanningWeek[] {
  return Array.from({ length: planningWeeks }, (_, weekOffset) => {
    const effectiveOffset = weekIndexOffset + weekOffset
    const currentWeekStart = addDays(weekStart, weekOffset * 7)
    const currentWeekEnd = addDays(currentWeekStart, 4)
    const weekNumber = getISOWeekNumber(currentWeekStart)

    let offPersonIndex = -1
    if (people.length > 5) {
      if (rotationMode === 'monthly') {
        const monthOffset = Math.floor(effectiveOffset / 4)
        offPersonIndex = (startIndex + monthOffset) % people.length
      } else {
        offPersonIndex = (startIndex + effectiveOffset) % people.length
      }
    }

    const offPerson = offPersonIndex === -1 ? '' : people[offPersonIndex]
    const activePeople =
      offPersonIndex === -1
        ? people.slice()
        : people.filter((_, i) => i !== offPersonIndex)

    const week = {
      weekIndex: effectiveOffset,
      weekNumber,
      weekStart: currentWeekStart,
      weekEnd: currentWeekEnd,
      offPerson,
      activePeople,
      entries: [] as PlanningEntry[],
    }

    week.entries = buildWeekEntries(week, effectiveOffset)
    return week
  })
}

export function getDefaultMonday(): string {
  const today = new Date()
  const currentDay = today.getDay()
  const diff = currentDay === 0 ? -6 : 1 - currentDay
  today.setDate(today.getDate() + diff)
  return toInputDate(today)
}

export function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateString}T12:00:00`))
}

export function formatFrenchDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${dateString}T12:00:00`))
}

export { addDays, getISOWeekNumber }
