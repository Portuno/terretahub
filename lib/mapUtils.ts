export type MapItemType = 'business' | 'event' | 'note' | 'dir_entity' | 'dir_person' | 'dir_event';
export type EventTimeFilter = 'past' | 'today' | 'future' | 'all';
export type MapSource = 'ugc' | 'directory';

export interface MapItem {
  id: string;
  type: MapItemType;
  source: MapSource;
  title: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  createdAt?: string;
  tags?: string[];
  eventStartDate?: string;
  geoPrecision?: 'sede' | 'calle' | 'barrio' | null;
  zoneName?: string | null;
  url?: string | null;
  directoryPath?: string | null;
  cats?: string[];
  tipo?: string | null;
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
  eventFilter: EventTimeFilter,
  options?: {
    search?: string;
    cats?: string[];
    zoneId?: number | null;
    subzoneId?: number | null;
  }
) => {
  const search = options?.search?.trim().toLowerCase() || '';
  const cats = options?.cats || [];

  return items.filter((item) => {
    if (!activeTypes.includes(item.type)) {
      return false;
    }

    if (search && !item.title.toLowerCase().includes(search)) {
      return false;
    }

    if (cats.length && item.cats?.length) {
      if (!item.cats.some((c) => cats.includes(c))) {
        return false;
      }
    } else if (cats.length && !item.cats?.length && item.source === 'directory') {
      return false;
    }

    if (options?.zoneId !== undefined && options.zoneId !== null) {
      // zone filter applied at load time via tagged fields when available
    }

    const isEventLike = item.type === 'event' || item.type === 'dir_event';
    if (!isEventLike || eventFilter === 'all') {
      return true;
    }

    return getEventTimeBucket(item.eventStartDate) === eventFilter;
  });
};

export const getFutureEventsCount = (items: MapItem[]) => {
  return items.filter(
    (item) =>
      (item.type === 'event' || item.type === 'dir_event') &&
      getEventTimeBucket(item.eventStartDate) === 'future'
  ).length;
};

export const MAP_TYPE_LABELS: Record<MapItemType, string> = {
  business: 'Negocios (comunidad)',
  event: 'Quedadas (comunidad)',
  note: 'Notas (comunidad)',
  dir_entity: 'Orgs (directorio)',
  dir_person: 'Personas (directorio)',
  dir_event: 'Citas (directorio)',
};
