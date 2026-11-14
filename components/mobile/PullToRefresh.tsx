import React, { useRef, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (event: React.TouchEvent) => {
    const scroller = document.getElementById('app-scroll');
    if (scroller && scroller.scrollTop > 0) return;
    startY.current = event.touches[0]?.clientY ?? null;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (startY.current === null || refreshing) return;
    const scroller = document.getElementById('app-scroll');
    if (scroller && scroller.scrollTop > 0) return;
    const delta = (event.touches[0]?.clientY ?? startY.current) - startY.current;
    setPull(Math.max(0, Math.min(delta, 72)));
  };

  const onTouchEnd = async () => {
    if (pull > 56 && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    startY.current = null;
    setPull(0);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="overflow-hidden text-center text-m-sm text-terreta-secondary duration-shell"
        style={{ height: pull || refreshing ? 28 : 0 }}
      >
        {refreshing ? 'Actualizando' : pull > 56 ? 'Soltá para actualizar' : ''}
      </div>
      {children}
    </div>
  );
};
