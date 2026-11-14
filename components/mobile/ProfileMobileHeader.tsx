import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { AuthUser } from '../../types';

interface ProfileMobileHeaderProps {
  user: AuthUser;
}

interface OwnProject {
  id: string;
  name: string;
  slogan: string | null;
}

interface OwnEvent {
  id: string;
  title: string;
  slug: string | null;
  start_date: string;
}

export const ProfileMobileHeader: React.FC<ProfileMobileHeaderProps> = ({ user }) => {
  const [projects, setProjects] = useState<OwnProject[]>([]);
  const [events, setEvents] = useState<OwnEvent[]>([]);
  const [publicPath, setPublicPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [projectResult, eventResult, linkResult] = await Promise.all([
        supabase.from('projects').select('id, name, slogan').eq('author_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('events').select('id, title, slug, start_date').eq('organizer_id', user.id).order('start_date', { ascending: false }).limit(3),
        supabase.from('link_bio_profiles').select('username, custom_slug, is_published').eq('user_id', user.id).eq('is_published', true).limit(1).maybeSingle(),
      ]);
      if (!active) return;
      setProjects((projectResult.data || []) as OwnProject[]);
      setEvents((eventResult.data || []) as OwnEvent[]);
      const link = linkResult.data as { username?: string; custom_slug?: string | null } | null;
      const extension = link?.custom_slug || link?.username;
      setPublicPath(extension ? `/p/${extension}` : null);
    };
    void load();
    return () => {
      active = false;
    };
  }, [user.id]);

  return (
    <section className="mb-4 rounded-shell border border-terreta-border bg-terreta-card p-4 shadow-shell">
      <div className="flex items-center gap-3">
        <img src={user.avatar} alt="" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
        <div className="min-w-0">
          <h2 className="truncate text-m-lg text-terreta-dark">{user.name}</h2>
          <p className="truncate text-m-sm text-terreta-secondary">@{user.username}</p>
        </div>
      </div>
      {publicPath ? (
        <Link to={publicPath} className="mt-3 block text-m-base font-semibold text-terreta-accent">
          Tu link público
        </Link>
      ) : (
        <p className="mt-3 text-m-sm text-terreta-secondary">Tu link público todavía no está publicado.</p>
      )}
      <div className="mt-4 grid gap-3">
        <div>
          <p className="text-m-sm font-semibold text-terreta-dark">Tus proyectos</p>
          {projects.length === 0 ? (
            <p className="text-m-sm text-terreta-secondary">Todavía no hay.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {projects.map((project) => (
                <li key={project.id} className="text-m-sm text-terreta-dark">
                  {project.name}
                  {project.slogan ? <span className="text-terreta-secondary"> — {project.slogan}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-m-sm font-semibold text-terreta-dark">Tus quedadas</p>
          {events.length === 0 ? (
            <p className="text-m-sm text-terreta-secondary">Todavía no hay.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {events.map((event) => (
                <li key={event.id} className="text-m-sm text-terreta-dark">
                  {event.slug ? (
                    <Link to={`/evento/${user.username}/${event.slug}`}>{event.title}</Link>
                  ) : (
                    event.title
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
