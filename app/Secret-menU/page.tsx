'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getCastawayLevel } from '@/lib/castaway-levels';

interface Sailing {
  id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
}

function parseLocal(ds: string) {
  const [y, m, d] = ds.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function SecretMenuPage() {
  const { user, session } = useAuth();
  const [bgTapCount, setBgTapCount] = useState(0);
  const [hackRevealed, setHackRevealed] = useState(false);
  const [hackVisible, setHackVisible] = useState(false);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [sailings, setSailings] = useState<Sailing[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [showUpcoming, setShowUpcoming] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/profiles/${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.profile?.handle) setUserHandle(data.profile.handle); })
      .catch(() => {});
  }, [user]);

  // Fetch user's sailings to find upcoming ones
  useEffect(() => {
    if (!user || !session?.access_token) return;
    fetch('/api/sailing-reviews/mine', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.sailings) setSailings(data.sailings); })
      .catch(() => {});
  }, [user, session?.access_token]);

  // Tick the countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Count past sailings for Castaway level
  const pastSailingCount = useMemo(() => {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    return sailings.filter(s => new Date(s.sail_end_date + 'T23:59:59') < todayStart).length;
  }, [sailings, now]);

  const castaway = useMemo(() => getCastawayLevel(pastSailingCount), [pastSailingCount]);

  const upcomingSailings = useMemo(() => {
    return sailings
      .filter(s => parseLocal(s.sail_start_date) > now)
      .sort((a, b) => parseLocal(a.sail_start_date).getTime() - parseLocal(b.sail_start_date).getTime());
  }, [sailings, now]);

  const nextSailing = upcomingSailings[0] ?? null;

  const countdown = useMemo(() => {
    if (!nextSailing) return null;
    const sailLocal = parseLocal(nextSailing.sail_start_date).getTime();
    const diff = sailLocal - now.getTime();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  }, [nextSailing, now]);

  // Castaway Club milestones for upcoming sailing
  const milestones = useMemo(() => {
    if (!nextSailing) return [];
    const sailDate = parseLocal(nextSailing.sail_start_date);
    const todayMid = new Date(now);
    todayMid.setHours(0, 0, 0, 0);
    const calendarDaysOut = Math.round((sailDate.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));

    const items: { label: string; daysOut: number; date: Date; done: boolean }[] = [];

    // Activity booking window
    const actDate = new Date(sailDate);
    actDate.setDate(actDate.getDate() - castaway.activityDays);
    items.push({
      label: 'Activity booking opens',
      daysOut: castaway.activityDays,
      date: actDate,
      done: calendarDaysOut <= castaway.activityDays,
    });

    // Online check-in window
    const ciDate = new Date(sailDate);
    ciDate.setDate(ciDate.getDate() - castaway.checkInDays);
    items.push({
      label: 'Online check-in opens',
      daysOut: castaway.checkInDays,
      date: ciDate,
      done: calendarDaysOut <= castaway.checkInDays,
    });

    return items;
  }, [nextSailing, now, castaway]);

  useEffect(() => {
    const hackPersisted = localStorage.getItem('secret-menu-hack-unlocked') === 'true';
    if (hackPersisted) {
      setHackRevealed(true);
      setHackVisible(true);
    }
  }, []);

  const handleBackgroundTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (hackRevealed) return;
      // Only count taps on the background, not on buttons/links
      if ((e.target as HTMLElement).closest('a')) return;
      const next = bgTapCount + 1;
      setBgTapCount(next);
      if (next >= 3) {
        setHackRevealed(true);
        localStorage.setItem('secret-menu-hack-unlocked', 'true');
        // Fade in after state update
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setHackVisible(true);
          });
        });
      }
    },
    [bgTapCount, hackRevealed]
  );

  const voyageHref = user
    ? `/profile/${userHandle || user.id}`
    : '/auth';

  return (
    <div
      className="max-w-2xl mx-auto min-h-[60vh]"
      onClick={handleBackgroundTap}
    >
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Cruise Guide
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Your Disney cruise planning hub — explore ships, dining, activities, and more.
        </p>
      </div>

      {/* Countdown to Next Sailing */}
      {nextSailing && countdown && (
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-800 dark:to-blue-800 rounded-2xl shadow-lg border border-cyan-400/30 dark:border-cyan-500/30 mb-4 overflow-hidden relative">
          <Link
            href="/planner"
            className="block p-5 hover:bg-white/5 transition-colors"
          >
            <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[7rem] opacity-15 select-none leading-none">🚢</div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-cyan-100 dark:text-cyan-200">
                  Next Sailing — {nextSailing.ship_name}
                </span>
                {castaway.level !== 'none' && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 ${castaway.color}`}>
                    {castaway.emoji} {castaway.label}
                  </span>
                )}
              </div>
              {nextSailing.itinerary_name && (
                <div className="text-xs text-cyan-200 dark:text-cyan-300 mb-3">{nextSailing.itinerary_name}</div>
              )}
              <div className="flex gap-3">
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center min-w-[4.5rem]">
                  <div className="text-2xl font-bold text-white">{countdown.days}</div>
                  <div className="text-xs text-cyan-100">{countdown.days === 1 ? 'day' : 'days'}</div>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center min-w-[4.5rem]">
                  <div className="text-2xl font-bold text-white">{countdown.hours}</div>
                  <div className="text-xs text-cyan-100">{countdown.hours === 1 ? 'hour' : 'hours'}</div>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center min-w-[4.5rem]">
                  <div className="text-2xl font-bold text-white">{countdown.minutes}</div>
                  <div className="text-xs text-cyan-100">{countdown.minutes === 1 ? 'min' : 'mins'}</div>
                </div>
              </div>
              <div className="text-xs text-cyan-200 mt-2">
                {parseLocal(nextSailing.sail_start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </Link>

          {/* Castaway Club Milestones */}
          {milestones.length > 0 && (
            <div className="border-t border-white/15 px-5 py-3 space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                    m.done ? 'bg-green-400/30 text-green-300' : 'bg-white/15 text-cyan-200'
                  }`}>
                    {m.done ? '✓' : '○'}
                  </span>
                  <span className={`flex-1 ${m.done ? 'text-green-200 line-through opacity-70' : 'text-cyan-100'}`}>
                    {m.label}
                  </span>
                  <span className={`flex-shrink-0 font-medium ${m.done ? 'text-green-300' : 'text-white'}`}>
                    {m.done
                      ? 'Open now'
                      : m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Sailings – collapsible list */}
      {upcomingSailings.length > 1 && (
        <div className="mb-4">
          <button
            onClick={() => setShowUpcoming(v => !v)}
            className="w-full flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-gold transition-all text-left"
          >
            <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🗓</span>
              View Upcoming Sailings
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({upcomingSailings.length})
              </span>
            </span>
            <svg
              className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${showUpcoming ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUpcoming && (
            <div className="mt-2 space-y-2">
              {upcomingSailings.map((s) => {
                const sailDate = parseLocal(s.sail_start_date);
                const endDate = parseLocal(s.sail_end_date);
                const diff = sailDate.getTime() - now.getTime();
                const daysAway = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
                const nights = Math.round((endDate.getTime() - sailDate.getTime()) / (1000 * 60 * 60 * 24));
                const activityDate = new Date(sailDate);
                activityDate.setDate(activityDate.getDate() - castaway.activityDays);
                const checkInDate = new Date(sailDate);
                checkInDate.setDate(checkInDate.getDate() - castaway.checkInDays);
                const todayMid = new Date(now);
                todayMid.setHours(0, 0, 0, 0);
                const activityOpen = todayMid >= activityDate;
                const checkInOpen = todayMid >= checkInDate;
                return (
                  <Link
                    key={s.id}
                    href="/planner"
                    className="block bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-gold transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {s.ship_name}
                        </div>
                        {s.itinerary_name && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.itinerary_name}</div>
                        )}
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {sailDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {nights > 0 && ` · ${nights}-night`}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-3 text-right">
                        <div className="text-lg font-bold text-disney-blue dark:text-disney-gold">{daysAway}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{daysAway === 1 ? 'day' : 'days'} away</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${activityOpen ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                          {activityOpen ? '✓' : '○'}
                        </span>
                        <span className={activityOpen ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                          Activities {activityOpen ? 'open' : activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${checkInOpen ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                          {checkInOpen ? '✓' : '○'}
                        </span>
                        <span className={checkInOpen ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                          Check-in {checkInOpen ? 'open' : checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Castaway Club prompt for users with no sailings */}
      {user && sailings.length === 0 && (
        <Link
          href="/Secret-menU/sailing"
          className="block bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-amber-200 dark:border-amber-800 mb-4 hover:border-disney-gold transition-all"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚓</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                Log your sailings to unlock Castaway Club perks
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Add your past and upcoming sailings to see your Castaway Club level, personalized check-in dates, activity booking windows, and complimentary dining benefits.
              </p>
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-disney-blue dark:text-disney-gold">
                + Log a Sailing
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* 2-Column Icon Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Row 1: Fleet Info | My Voyages */}
        <Link
          href="/Secret-menU/ships"
          className="bg-gradient-to-br from-disney-blue to-blue-800 dark:from-blue-900 dark:to-blue-800 rounded-2xl p-4 shadow-lg border border-blue-400/30 dark:border-blue-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
        >
          <div className="text-3xl mb-2">🚢</div>
          <div className="text-sm font-bold text-white">Fleet Info</div>
          <div className="text-xs text-blue-200 dark:text-blue-300 mt-0.5">All 8 ships</div>
        </Link>

        {user ? (
          <Link
            href={voyageHref}
            className="bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 rounded-2xl p-4 shadow-lg border border-slate-500/30 dark:border-slate-400/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
          >
            <div className="text-3xl mb-2">🧭</div>
            <div className="text-sm font-bold text-white">My Voyages</div>
            <div className="text-xs text-slate-300 dark:text-slate-400 mt-0.5">Sailing history</div>
          </Link>
        ) : (
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 rounded-2xl p-4 shadow-lg border border-slate-500/30 dark:border-slate-400/30 text-center opacity-40 cursor-not-allowed">
            <div className="text-3xl mb-2">🧭</div>
            <div className="text-sm font-bold text-white">My Voyages</div>
            <div className="text-xs text-slate-300 dark:text-slate-400 mt-0.5">Sign in required</div>
          </div>
        )}

        {/* Row 2: Cruise Guide | Stateroom Guide */}
        <Link
          href="/Secret-menU/cruise-guide"
          className="bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-800 dark:to-purple-900 rounded-2xl p-4 shadow-lg border border-indigo-400/30 dark:border-indigo-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
        >
          <div className="text-3xl mb-2">🗺</div>
          <div className="text-sm font-bold text-white">Cruise Guide</div>
          <div className="text-xs text-indigo-200 dark:text-indigo-300 mt-0.5">Everything onboard</div>
        </Link>

        <Link
          href="/Secret-menU/stateroom-guide"
          className="bg-gradient-to-br from-teal-600 to-emerald-600 dark:from-teal-800 dark:to-emerald-800 rounded-2xl p-4 shadow-lg border border-teal-400/30 dark:border-teal-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
        >
          <div className="text-3xl mb-2">🛏</div>
          <div className="text-sm font-bold text-white">Stateroom Guide</div>
          <div className="text-xs text-teal-200 dark:text-teal-300 mt-0.5">Find your room</div>
        </Link>

        {/* Row 3: Friendship | Pixie Dust */}
        {user ? (
          <Link
            href="/friends"
            className="bg-gradient-to-br from-rose-600 to-pink-600 dark:from-rose-800 dark:to-pink-800 rounded-2xl p-4 shadow-lg border border-rose-400/30 dark:border-rose-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
          >
            <div className="text-3xl mb-2">👫</div>
            <div className="text-sm font-bold text-white">Friendship</div>
            <div className="text-xs text-rose-200 dark:text-rose-300 mt-0.5">Friends & crew</div>
          </Link>
        ) : (
          <div className="bg-gradient-to-br from-rose-600 to-pink-600 dark:from-rose-800 dark:to-pink-800 rounded-2xl p-4 shadow-lg border border-rose-400/30 dark:border-rose-500/30 text-center opacity-40 cursor-not-allowed">
            <div className="text-3xl mb-2">👫</div>
            <div className="text-sm font-bold text-white">Friendship</div>
            <div className="text-xs text-rose-200 dark:text-rose-300 mt-0.5">Sign in required</div>
          </div>
        )}

        {user ? (
          <Link
            href="/planner/pixie-dust"
            className="bg-gradient-to-br from-fuchsia-600 to-purple-600 dark:from-fuchsia-800 dark:to-purple-800 rounded-2xl p-4 shadow-lg border border-fuchsia-400/30 dark:border-fuchsia-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
          >
            <div className="text-3xl mb-2">✨</div>
            <div className="text-sm font-bold text-white">Pixie Dust</div>
            <div className="text-xs text-fuchsia-200 dark:text-fuchsia-300 mt-0.5">Send some magic</div>
          </Link>
        ) : (
          <div className="bg-gradient-to-br from-fuchsia-600 to-purple-600 dark:from-fuchsia-800 dark:to-purple-800 rounded-2xl p-4 shadow-lg border border-fuchsia-400/30 dark:border-fuchsia-500/30 text-center opacity-40 cursor-not-allowed">
            <div className="text-3xl mb-2">✨</div>
            <div className="text-sm font-bold text-white">Pixie Dust</div>
            <div className="text-xs text-fuchsia-200 dark:text-fuchsia-300 mt-0.5">Sign in required</div>
          </div>
        )}

        {/* Row 4: Character Checklist | Movie Checklist */}
        {user ? (
          <Link
            href="/Secret-menU/characters"
            className="bg-gradient-to-br from-amber-600 to-yellow-600 dark:from-amber-800 dark:to-yellow-800 rounded-2xl p-4 shadow-lg border border-amber-400/30 dark:border-amber-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
          >
            <div className="text-3xl mb-2">📸</div>
            <div className="text-sm font-bold text-white">Character Checklist</div>
            <div className="text-xs text-amber-200 dark:text-amber-300 mt-0.5">Meet & greets</div>
          </Link>
        ) : (
          <div className="bg-gradient-to-br from-amber-600 to-yellow-600 dark:from-amber-800 dark:to-yellow-800 rounded-2xl p-4 shadow-lg border border-amber-400/30 dark:border-amber-500/30 text-center opacity-40 cursor-not-allowed">
            <div className="text-3xl mb-2">📸</div>
            <div className="text-sm font-bold text-white">Character Checklist</div>
            <div className="text-xs text-amber-200 dark:text-amber-300 mt-0.5">Sign in required</div>
          </div>
        )}

        {user ? (
          <Link
            href="/Secret-menU/movies"
            className="bg-gradient-to-br from-violet-600 to-indigo-600 dark:from-violet-800 dark:to-indigo-800 rounded-2xl p-4 shadow-lg border border-violet-400/30 dark:border-violet-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
          >
            <div className="text-3xl mb-2">🎬</div>
            <div className="text-sm font-bold text-white">Movie Checklist</div>
            <div className="text-xs text-violet-200 dark:text-violet-300 mt-0.5">Disney film tracker</div>
          </Link>
        ) : (
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 dark:from-violet-800 dark:to-indigo-800 rounded-2xl p-4 shadow-lg border border-violet-400/30 dark:border-violet-500/30 text-center opacity-40 cursor-not-allowed">
            <div className="text-3xl mb-2">🎬</div>
            <div className="text-sm font-bold text-white">Movie Checklist</div>
            <div className="text-xs text-violet-200 dark:text-violet-300 mt-0.5">Sign in required</div>
          </div>
        )}

        {/* Row 5: Entertainment | Activity Guide */}
        {user ? (
          <Link
            href="/Secret-menU/entertainment"
            className="bg-gradient-to-br from-purple-600 to-indigo-600 dark:from-purple-800 dark:to-indigo-800 rounded-2xl p-4 shadow-lg border border-purple-400/30 dark:border-purple-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
          >
            <div className="text-3xl mb-2">🎭</div>
            <div className="text-sm font-bold text-white">Entertainment</div>
            <div className="text-xs text-purple-200 dark:text-purple-300 mt-0.5">Shows & parties</div>
          </Link>
        ) : (
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 dark:from-purple-800 dark:to-indigo-800 rounded-2xl p-4 shadow-lg border border-purple-400/30 dark:border-purple-500/30 text-center opacity-40 cursor-not-allowed">
            <div className="text-3xl mb-2">🎭</div>
            <div className="text-sm font-bold text-white">Entertainment</div>
            <div className="text-xs text-purple-200 dark:text-purple-300 mt-0.5">Sign in required</div>
          </div>
        )}

        {user ? (
          <Link
            href="/Secret-menU/things-to-do"
            className="bg-gradient-to-br from-cyan-600 to-teal-600 dark:from-cyan-800 dark:to-teal-800 rounded-2xl p-4 shadow-lg border border-cyan-400/30 dark:border-cyan-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
          >
            <div className="text-3xl mb-2">🎢</div>
            <div className="text-sm font-bold text-white">Activity Guide</div>
            <div className="text-xs text-cyan-200 dark:text-cyan-300 mt-0.5">Pools, rides & more</div>
          </Link>
        ) : (
          <div className="bg-gradient-to-br from-cyan-600 to-teal-600 dark:from-cyan-800 dark:to-teal-800 rounded-2xl p-4 shadow-lg border border-cyan-400/30 dark:border-cyan-500/30 text-center opacity-40 cursor-not-allowed">
            <div className="text-3xl mb-2">🎢</div>
            <div className="text-sm font-bold text-white">Activity Guide</div>
            <div className="text-xs text-cyan-200 dark:text-cyan-300 mt-0.5">Sign in required</div>
          </div>
        )}

        {/* Row 6: Foodie Guide | Shopping Guide */}
        {user ? (
          <Link
            href="/Secret-menU/foodies"
            className="bg-gradient-to-br from-orange-600 to-red-600 dark:from-orange-800 dark:to-red-800 rounded-2xl p-4 shadow-lg border border-orange-400/30 dark:border-orange-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
          >
            <div className="text-3xl mb-2">🍽️</div>
            <div className="text-sm font-bold text-white">Foodie Guide</div>
            <div className="text-xs text-orange-200 dark:text-orange-300 mt-0.5">All dining options</div>
          </Link>
        ) : (
          <div className="bg-gradient-to-br from-orange-600 to-red-600 dark:from-orange-800 dark:to-red-800 rounded-2xl p-4 shadow-lg border border-orange-400/30 dark:border-orange-500/30 text-center opacity-40 cursor-not-allowed">
            <div className="text-3xl mb-2">🍽️</div>
            <div className="text-sm font-bold text-white">Foodie Guide</div>
            <div className="text-xs text-orange-200 dark:text-orange-300 mt-0.5">Sign in required</div>
          </div>
        )}

        {user ? (
          <Link
            href="/Secret-menU/shopping"
            className="bg-gradient-to-br from-pink-600 to-fuchsia-600 dark:from-pink-800 dark:to-fuchsia-800 rounded-2xl p-4 shadow-lg border border-pink-400/30 dark:border-pink-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
          >
            <div className="text-3xl mb-2">🛍️</div>
            <div className="text-sm font-bold text-white">Shopping Guide</div>
            <div className="text-xs text-pink-200 dark:text-pink-300 mt-0.5">Shops & boutiques</div>
          </Link>
        ) : (
          <div className="bg-gradient-to-br from-pink-600 to-fuchsia-600 dark:from-pink-800 dark:to-fuchsia-800 rounded-2xl p-4 shadow-lg border border-pink-400/30 dark:border-pink-500/30 text-center opacity-40 cursor-not-allowed">
            <div className="text-3xl mb-2">🛍️</div>
            <div className="text-sm font-bold text-white">Shopping Guide</div>
            <div className="text-xs text-pink-200 dark:text-pink-300 mt-0.5">Sign in required</div>
          </div>
        )}

        {/* Row 7: Cruise Hacks (easter egg, spans 2 cols) */}
        {hackRevealed && (
          <Link
            href="/Secret-menU/hacks"
            className={`bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-4 shadow-lg border border-slate-600 dark:border-slate-500 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center col-span-2 ${
              hackVisible ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-700`}
          >
            <div className="text-3xl mb-2">🏴‍☠️</div>
            <div className="text-sm font-bold text-white">Cruise Hacks</div>
            <div className="text-xs text-slate-400 mt-0.5">Tips & tricks</div>
          </Link>
        )}
      </div>
    </div>
  );
}
