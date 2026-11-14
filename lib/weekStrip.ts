export interface WeekDay {
  iso: string;
  label: string;
  dayNumber: number;
}

export const localIso = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const currentWeek = (now: Date): WeekDay[] => {
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  const weekday = cursor.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  cursor.setDate(cursor.getDate() + mondayOffset);
  const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return labels.map((label, index) => {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + index);
    return { iso: localIso(day), label, dayNumber: day.getDate() };
  });
};

export const isSameLocalDay = (isoDateTime: string, isoDay: string): boolean => {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return false;
  return localIso(date) === isoDay;
};
