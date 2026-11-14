import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface WeekCounts {
  profiles: number;
  posts: number;
  attendances: number;
  projects: number;
}

const empty: WeekCounts = { profiles: 0, posts: 0, attendances: 0, projects: 0 };

const countSince = async (table: string, column: string, from: string, until: string): Promise<number> => {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .gte(column, from)
    .lt(column, until);
  if (error) return 0;
  return count || 0;
};

export const WeeklyRetentionPanel: React.FC = () => {
  const [current, setCurrent] = useState<WeekCounts>(empty);
  const [previous, setPrevious] = useState<WeekCounts>(empty);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const [profiles, posts, attendances, projects, prevProfiles, prevPosts, prevAttendances, prevProjects] =
        await Promise.all([
          countSince('profiles', 'created_at', weekAgo.toISOString(), now.toISOString()),
          countSince('agora_posts', 'created_at', weekAgo.toISOString(), now.toISOString()),
          countSince('event_attendances', 'registered_at', weekAgo.toISOString(), now.toISOString()),
          countSince('projects', 'created_at', weekAgo.toISOString(), now.toISOString()),
          countSince('profiles', 'created_at', twoWeeksAgo.toISOString(), weekAgo.toISOString()),
          countSince('agora_posts', 'created_at', twoWeeksAgo.toISOString(), weekAgo.toISOString()),
          countSince('event_attendances', 'registered_at', twoWeeksAgo.toISOString(), weekAgo.toISOString()),
          countSince('projects', 'created_at', twoWeeksAgo.toISOString(), weekAgo.toISOString()),
        ]);
      setCurrent({ profiles, posts, attendances, projects });
      setPrevious({
        profiles: prevProfiles,
        posts: prevPosts,
        attendances: prevAttendances,
        projects: prevProjects,
      });
    };
    void load();
  }, []);

  const rows: Array<{ label: string; key: keyof WeekCounts }> = [
    { label: 'Perfiles nuevos', key: 'profiles' },
    { label: 'Posts en el Ágora', key: 'posts' },
    { label: 'Inscripciones', key: 'attendances' },
    { label: 'Proyectos creados', key: 'projects' },
  ];

  return (
    <section className="mb-6 rounded-shell border border-terreta-border bg-terreta-card p-4" aria-label="Retención semanal">
      <h3 className="text-m-lg text-terreta-dark">Esta semana</h3>
      <p className="mb-3 text-m-sm text-terreta-secondary">Comparado con los siete días anteriores. Solo lo que tus permisos dejan ver.</p>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.key} className="flex items-baseline justify-between gap-3 text-m-base text-terreta-dark">
            <span>{row.label}</span>
            <span>
              {current[row.key]} <span className="text-m-sm text-terreta-secondary">antes {previous[row.key]}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
