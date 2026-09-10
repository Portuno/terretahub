export type MapItemType = 'business' | 'event' | 'note';
export type EventTimeFilter = 'past' | 'today' | 'future' | 'all';

export interface MapItem {
  id: string;
  type: MapItemType;
  title: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  createdAt?: string;
  tags?: string[];
  eventStartDate?: string;
}

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const getEventTimeBucket = (eventStartDate?: string): EventTimeFilter => {
  if (!eventStartDate) return 'all';
  const eventDate = new Date(eventStartDate);
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (eventDate < today) return 'past';
  if (eventDate >= today && eventDate < tomorrow) return 'today';
  return 'future';
};

export const filterMapItems = (
  items: MapItem[],
  activeTypes: MapItemType[],
  eventFilter: EventTimeFilter
) => {
  return items.filter((item) => {
    if (!activeTypes.includes(item.type)) {
      return false;
    }

    if (item.type !== 'event' || eventFilter === 'all') {
      return true;
    }

    return getEventTimeBucket(item.eventStartDate) === eventFilter;
  });
};

export const getFutureEventsCount = (items: MapItem[]) => {
  return items.filter((item) => item.type === 'event' && getEventTimeBucket(item.eventStartDate) === 'future').length;
};
