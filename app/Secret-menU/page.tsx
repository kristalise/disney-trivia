'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getCastawayLevel } from '@/lib/castaway-levels';
import { getFoodieVenueById } from '@/lib/foodie-data';
import { getExperienceById } from '@/lib/entertainment-data';
import { getActivityById as getThingsToDoById } from '@/lib/things-to-do-data';
import { getShopById } from '@/lib/shopping-data';
import { lookupStateroomInfo } from '@/lib/stateroom-utils';

const CHECKIN_TASKS = [
  { id: 'passport', label: 'Upload passport or ID photos' },
  { id: 'selfie', label: 'Take a selfie (plain background, no glasses)' },
  { id: 'pat', label: 'Select port arrival time (PAT)' },
  { id: 'safety', label: 'Complete safety information' },
  { id: 'payment', label: 'Set up onboard payment method' },
  { id: 'contacts', label: 'Add emergency contacts' },
];

const BOOKABLE_TYPES = ['activity', 'entertainment', 'dining', 'shopping'];

const PAT_OPTIONS = [
  { value: '11:00', label: '11:00 AM' },
  { value: '11:15', label: '11:15 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '11:45', label: '11:45 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:15', label: '12:15 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '12:45', label: '12:45 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '13:15', label: '1:15 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '13:45', label: '1:45 PM' },
  { value: '14:00', label: '2:00 PM' },
];

const CANCELLATION_TIERS_SHORT = [
  { min: 90, label: '90+ days prior', desc: 'No fee — fully refundable', color: 'text-green-300' },
  { min: 45, label: '89–45 days prior', desc: 'Loss of deposit', color: 'text-yellow-300' },
  { min: 30, label: '44–30 days prior', desc: '50% cancellation fee', color: 'text-orange-300' },
  { min: 15, label: '29–15 days prior', desc: '75% cancellation fee', color: 'text-red-300' },
  { min: 0, label: '14 days or less', desc: '100% — non-refundable', color: 'text-red-400' },
];

const CANCELLATION_TIERS_LONG = [
  { min: 120, label: '120+ days prior', desc: 'No fee — fully refundable', color: 'text-green-300' },
  { min: 0, label: 'Under 120 days', desc: 'Cancellation fees apply', color: 'text-orange-300' },
];

const CANCELLATION_TIERS_CONCIERGE_SHORT = [
  { min: 90, label: '90+ days prior', desc: 'Deposit non-refundable', color: 'text-yellow-300' },
  { min: 45, label: '89–45 days prior', desc: '50% cancellation fee', color: 'text-orange-300' },
  { min: 30, label: '44–30 days prior', desc: '75% cancellation fee', color: 'text-red-300' },
  { min: 0, label: '29 days or less', desc: '100% — non-refundable', color: 'text-red-400' },
];

const CANCELLATION_TIERS_CONCIERGE_LONG = [
  { min: 150, label: '150+ days prior', desc: 'Deposit non-refundable', color: 'text-yellow-300' },
  { min: 90, label: '149–90 days prior', desc: '50% cancellation fee', color: 'text-orange-300' },
  { min: 45, label: '89–45 days prior', desc: '75% cancellation fee', color: 'text-red-300' },
  { min: 0, label: '44 days or less', desc: '100% — non-refundable', color: 'text-red-400' },
];

function getPortTimezone(port: string): string {
  const p = port.toLowerCase();
  if (p.includes('canaveral') || p.includes('miami') || p.includes('fort lauderdale') || p.includes('new york') || p.includes('quebec')) return 'America/New_York';
  if (p.includes('galveston') || p.includes('new orleans')) return 'America/Chicago';
  if (p.includes('san diego') || p.includes('los angeles') || p.includes('seattle') || p.includes('vancouver')) return 'America/Los_Angeles';
  if (p.includes('honolulu') || p.includes('hawai')) return 'Pacific/Honolulu';
  if (p.includes('san juan') || p.includes('puerto rico')) return 'America/Puerto_Rico';
  if (p.includes('southampton') || p.includes('dover') || p.includes('liverpool') || p.includes('newcastle') || p.includes('tilbury') || p.includes('london')) return 'Europe/London';
  if (p.includes('barcelona')) return 'Europe/Madrid';
  if (p.includes('civitavecchia') || p.includes('rome') || p.includes('venice')) return 'Europe/Rome';
  if (p.includes('copenhagen')) return 'Europe/Copenhagen';
  if (p.includes('bremerhaven')) return 'Europe/Berlin';
  if (p.includes('eemshaven') || p.includes('netherlands')) return 'Europe/Amsterdam';
  if (p.includes('singapore')) return 'Asia/Singapore';
  if (p.includes('tokyo') || p.includes('japan')) return 'Asia/Tokyo';
  if (p.includes('auckland') || p.includes('new zealand')) return 'Pacific/Auckland';
  if (p.includes('sydney')) return 'Australia/Sydney';
  if (p.includes('melbourne')) return 'Australia/Melbourne';
  if (p.includes('brisbane')) return 'Australia/Brisbane';
  return 'America/New_York';
}

/** Convert a date + local time in a given timezone to a UTC Date */
function portTimeToDate(dateStr: string, hours: number, minutes: number, tz: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const ts = Date.UTC(y, m - 1, d, hours, minutes, 0);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(new Date(ts));
  const g = (t: string) => parseInt(parts.find(p => p.type === t)?.value || '0');
  const tzDate = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') === 24 ? 0 : g('hour'), g('minute'), 0);
  const offset = ts - tzDate;
  const targetLocal = Date.UTC(y, m - 1, d, hours, minutes, 0);
  return new Date(targetLocal + offset);
}

interface PlannerItem {
  id: string;
  sailing_id: string;
  item_type: string;
  item_id: string;
  checked: boolean;
  notes: string | null;
  created_at: string;
}

function lookupItemName(itemType: string, itemId: string): string {
  if (itemType === 'activity') {
    const act = getThingsToDoById(itemId);
    if (act) return act.name;
  }
  if (itemType === 'dining') {
    const fv = getFoodieVenueById(itemId);
    if (fv) return fv.name;
  }
  if (itemType === 'entertainment') {
    const exp = getExperienceById(itemId);
    if (exp) return exp.name;
  }
  if (itemType === 'shopping') {
    const shop = getShopById(itemId);
    if (shop) return shop.name;
  }
  // Fallback: convert id to readable name
  return itemId.split('-').map((w, i) => {
    if (['and', 'of', 'the', 'at', 'in', 'on', 'for'].includes(w) && i > 0) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

function lookupItemEmoji(itemType: string): string {
  switch (itemType) {
    case 'activity': return '🎢';
    case 'dining': return '🍽️';
    case 'entertainment': return '🎭';
    case 'shopping': return '🛍️';
    default: return '📌';
  }
}

interface Sailing {
  id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
  embarkation_port: string;
  stateroom_numbers: number[] | null;
}

function parseLocal(ds: string) {
  const [y, m, d] = ds.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function SecretMenuPage() {
  const { user, session } = useAuth();
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [sailings, setSailings] = useState<Sailing[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [expandedMilestone, setExpandedMilestone] = useState<'activity' | 'checkin' | 'payment' | 'cancellation' | null>(null);
  const [checkinTasks, setCheckinTasks] = useState<Record<string, boolean>>({});
  const [paymentMade, setPaymentMade] = useState(false);
  const [activityPlannerItems, setActivityPlannerItems] = useState<PlannerItem[]>([]);
  const [activityChecked, setActivityChecked] = useState<Record<string, boolean>>({});
  const [patTime, setPatTime] = useState<string | null>(null);

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

  // Tick the countdown every minute (upgraded to every second during boarding phase below)
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
    const todayMid = new Date(now);
    todayMid.setHours(0, 0, 0, 0);
    return sailings
      .filter(s => parseLocal(s.sail_start_date) >= todayMid)
      .sort((a, b) => parseLocal(a.sail_start_date).getTime() - parseLocal(b.sail_start_date).getTime());
  }, [sailings, now]);

  const nextSailing = upcomingSailings[0] ?? null;

  // Load checkin tasks from localStorage when nextSailing changes
  useEffect(() => {
    if (!nextSailing) return;
    try {
      const stored = localStorage.getItem(`checkin-tasks:${nextSailing.id}`);
      if (stored) setCheckinTasks(JSON.parse(stored));
      else setCheckinTasks({});
      const storedAct = localStorage.getItem(`activity-checked:${nextSailing.id}`);
      if (storedAct) setActivityChecked(JSON.parse(storedAct));
      else setActivityChecked({});
      const storedPat = localStorage.getItem(`pat-time:${nextSailing.id}`);
      if (storedPat) setPatTime(storedPat);
      else setPatTime(null);
      const storedPayment = localStorage.getItem(`payment-made:${nextSailing.id}`);
      setPaymentMade(storedPayment === 'true');
    } catch { /* ignore */ }
  }, [nextSailing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch planner items for activity booking sub-checklist
  useEffect(() => {
    if (!nextSailing || !user || !session?.access_token) {
      setActivityPlannerItems([]);
      return;
    }
    fetch(`/api/planner-items?sailing_id=${nextSailing.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.items) {
          setActivityPlannerItems(
            data.items.filter((it: PlannerItem) => BOOKABLE_TYPES.includes(it.item_type))
          );
        }
      })
      .catch(() => {});
  }, [nextSailing?.id, user, session?.access_token]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCheckinTask = useCallback((taskId: string) => {
    if (!nextSailing) return;
    setCheckinTasks(prev => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      localStorage.setItem(`checkin-tasks:${nextSailing.id}`, JSON.stringify(next));
      if (taskId === 'pat' && !next[taskId]) {
        setPatTime(null);
        localStorage.removeItem(`pat-time:${nextSailing.id}`);
      }
      return next;
    });
  }, [nextSailing]);

  const handlePatTimeChange = useCallback((time: string) => {
    if (!nextSailing) return;
    setPatTime(time);
    localStorage.setItem(`pat-time:${nextSailing.id}`, time);
  }, [nextSailing]);

  const toggleActivityItem = useCallback((itemId: string) => {
    if (!nextSailing) return;
    setActivityChecked(prev => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      localStorage.setItem(`activity-checked:${nextSailing.id}`, JSON.stringify(next));
      return next;
    });
  }, [nextSailing]);

  const togglePaymentMade = useCallback(() => {
    if (!nextSailing) return;
    setPaymentMade(prev => {
      const next = !prev;
      localStorage.setItem(`payment-made:${nextSailing.id}`, String(next));
      return next;
    });
  }, [nextSailing]);

  // Derive completion state for milestones
  const checkinAllDone = CHECKIN_TASKS.every(t => checkinTasks[t.id]);
  const activityAllDone = activityPlannerItems.length > 0 && activityPlannerItems.every(it => activityChecked[it.id]);

  const effectivePatTime = patTime ?? '14:00';

  const countdown = useMemo(() => {
    if (!nextSailing) return null;
    const tz = getPortTimezone(nextSailing.embarkation_port);
    const [ph, pm] = effectivePatTime.split(':').map(Number);
    const patTarget = portTimeToDate(nextSailing.sail_start_date, ph, pm, tz);
    const diff = patTarget.getTime() - now.getTime();
    if (diff <= 0) return null;
    const sailLocal = parseLocal(nextSailing.sail_start_date);
    const todayMid = new Date(now);
    todayMid.setHours(0, 0, 0, 0);
    const isToday = sailLocal.getTime() === todayMid.getTime();
    if (isToday) {
      // Boarding phase — live seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { days: 0, hours, minutes, seconds, phase: 'boarding' as const };
    }
    // Pre-boarding — count down to PAT time
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes, phase: 'sailing' as const };
  }, [nextSailing, now, effectivePatTime]);

  // Tick every second during boarding phase for live seconds display
  const isBoarding = countdown?.phase === 'boarding';
  useEffect(() => {
    if (!isBoarding) return;
    const interval = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(interval);
  }, [isBoarding]);

  const cruiseNights = useMemo(() => {
    if (!nextSailing) return 0;
    const start = parseLocal(nextSailing.sail_start_date);
    const end = parseLocal(nextSailing.sail_end_date);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [nextSailing]);

  const daysUntilSailing = useMemo(() => {
    if (!nextSailing) return 0;
    const sailDate = parseLocal(nextSailing.sail_start_date);
    const todayMid = new Date(now);
    todayMid.setHours(0, 0, 0, 0);
    return Math.round((sailDate.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));
  }, [nextSailing, now]);

  const isConcierge = useMemo(() => {
    if (!nextSailing?.stateroom_numbers?.length) return false;
    const info = lookupStateroomInfo(nextSailing.stateroom_numbers[0], nextSailing.ship_name);
    return info?.type === 'Concierge / Suite';
  }, [nextSailing]);

  // Castaway Club milestones for upcoming sailing
  const milestones = useMemo(() => {
    if (!nextSailing) return [];
    const sailDate = parseLocal(nextSailing.sail_start_date);

    const items: { label: string; type: 'payment' | 'activity' | 'checkin'; daysOut: number; date: Date; done: boolean }[] = [];

    // Full payment due
    const paymentDueDays = isConcierge
      ? (cruiseNights >= 6 ? 150 : 90)
      : (cruiseNights >= 6 ? 120 : 90);
    const payDate = new Date(sailDate);
    payDate.setDate(payDate.getDate() - paymentDueDays);
    items.push({
      label: 'Full payment due',
      type: 'payment',
      daysOut: paymentDueDays,
      date: payDate,
      done: daysUntilSailing <= paymentDueDays,
    });

    // Activity booking window
    const actDate = new Date(sailDate);
    actDate.setDate(actDate.getDate() - castaway.activityDays);
    items.push({
      label: 'Activity booking opens',
      type: 'activity',
      daysOut: castaway.activityDays,
      date: actDate,
      done: daysUntilSailing <= castaway.activityDays,
    });

    // Online check-in window
    const ciDate = new Date(sailDate);
    ciDate.setDate(ciDate.getDate() - castaway.checkInDays);
    items.push({
      label: 'Online check-in opens',
      type: 'checkin',
      daysOut: castaway.checkInDays,
      date: ciDate,
      done: daysUntilSailing <= castaway.checkInDays,
    });

    // Sort by daysOut descending (farthest out first)
    items.sort((a, b) => b.daysOut - a.daysOut);

    return items;
  }, [nextSailing, daysUntilSailing, cruiseNights, isConcierge, castaway]);


  const voyageHref = user
    ? `/profile/${userHandle || user.id}`
    : '/auth';

  return (
    <div className="max-w-2xl mx-auto min-h-[60vh]">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Disney Cruise Companion
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Your ultimate all-in-one tool to create magic experiences for you and your fellow cruisers.
        </p>
      </div>

      {/* Countdown to Next Sailing */}
      {nextSailing && countdown && (
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-800 dark:to-blue-800 rounded-2xl shadow-lg border border-cyan-400/30 dark:border-cyan-500/30 mb-4 overflow-hidden relative">
          <Link
            href="/planner"
            className="block p-5 hover:bg-white/5 transition-colors"
          >
            <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[7rem] opacity-15 select-none leading-none">{countdown.phase === 'boarding' ? '⚓' : '🚢'}</div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-cyan-100 dark:text-cyan-200">
                  {countdown.phase === 'boarding' ? 'Boarding' : 'Next Sailing'} — {nextSailing.ship_name}
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
                {countdown.phase !== 'boarding' && (
                  <div className="bg-white/20 rounded-xl px-4 py-2 text-center min-w-[4.5rem]">
                    <div className="text-2xl font-bold text-white">{countdown.days}</div>
                    <div className="text-xs text-cyan-100">{countdown.days === 1 ? 'day' : 'days'}</div>
                  </div>
                )}
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center min-w-[4.5rem]">
                  <div className="text-2xl font-bold text-white">{countdown.hours}</div>
                  <div className="text-xs text-cyan-100">{countdown.hours === 1 ? 'hour' : 'hours'}</div>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center min-w-[4.5rem]">
                  <div className="text-2xl font-bold text-white">{countdown.minutes}</div>
                  <div className="text-xs text-cyan-100">{countdown.minutes === 1 ? 'min' : 'mins'}</div>
                </div>
                {countdown.phase === 'boarding' && 'seconds' in countdown && (
                  <div className="bg-white/20 rounded-xl px-4 py-2 text-center min-w-[4.5rem]">
                    <div className="text-2xl font-bold text-white">{countdown.seconds}</div>
                    <div className="text-xs text-cyan-100">secs</div>
                  </div>
                )}
              </div>
              <div className="text-xs text-cyan-200 mt-2">
                {countdown.phase === 'boarding'
                  ? `Port arrival at ${PAT_OPTIONS.find(o => o.value === effectivePatTime)?.label ?? effectivePatTime}`
                  : parseLocal(nextSailing.sail_start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </Link>

          {/* Castaway Club Milestones */}
          {milestones.length > 0 && (
            <div className="border-t border-white/15 px-5 py-3 space-y-1">
              {milestones.map((m, i) => {
                const milestoneKey = m.type;
                const isExpanded = expandedMilestone === milestoneKey;
                const allDone = m.type === 'activity' ? activityAllDone : m.type === 'checkin' ? checkinAllDone : paymentMade;

                if (!m.done) {
                  // Future milestone — static display
                  return (
                    <div key={i} className="flex items-center gap-2.5 text-xs">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center bg-white/15 text-cyan-200">
                        ○
                      </span>
                      <span className="flex-1 text-cyan-100">{m.label}</span>
                      <span className="flex-shrink-0 font-medium text-white">
                        {m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                }

                // Open milestone — interactive
                return (
                  <div key={i}>
                    <button
                      onClick={() => setExpandedMilestone(isExpanded ? null : milestoneKey)}
                      className="w-full flex items-center gap-2.5 text-xs py-1 group"
                    >
                      <span className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center border-2 transition-colors ${
                        allDone
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-white/40 text-transparent group-hover:border-white/60'
                      }`}>
                        {allDone && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={`flex-1 text-left ${allDone ? 'text-green-200 line-through opacity-70' : 'text-cyan-100'}`}>
                        {m.label}
                      </span>
                      <span className={`flex-shrink-0 font-medium mr-1 ${allDone ? 'text-green-300' : m.type === 'payment' ? 'text-yellow-300' : 'text-green-300'}`}>
                        {allDone ? 'Complete' : m.type === 'payment' ? 'Due now' : 'Open now'}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Sub-checklist */}
                    {isExpanded && (
                      <div className="mt-1 mb-2 ml-6 bg-white/5 rounded-lg p-2.5 space-y-1.5">
                        {m.type === 'payment' ? (
                          <>
                            <label className="flex items-center gap-2 text-xs cursor-pointer group/item">
                              <span
                                onClick={(e) => { e.preventDefault(); togglePaymentMade(); }}
                                className={`flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                                  paymentMade
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-white/30 text-transparent group-hover/item:border-white/50'
                                }`}
                              >
                                {paymentMade && (
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                              <span className={`${paymentMade ? 'text-green-200/70 line-through' : 'text-cyan-100'}`}>
                                Full payment made
                              </span>
                            </label>
                            <div className="text-[10px] text-cyan-200/50 mt-1">
                              {isConcierge
                                ? `Due ${cruiseNights >= 6 ? '150' : '90'} days before sailing (Concierge / Suite)`
                                : `Due ${cruiseNights >= 6 ? '120' : '90'} days before sailing for ${cruiseNights >= 6 ? '6+ night' : '1–5 night'} cruises`}
                            </div>
                          </>
                        ) : m.type === 'activity' ? (
                          // Activity booking sub-items from planner
                          activityPlannerItems.length > 0 ? (
                            activityPlannerItems.map(item => (
                              <label
                                key={item.id}
                                className="flex items-center gap-2 text-xs cursor-pointer group/item"
                              >
                                <span
                                  onClick={(e) => { e.preventDefault(); toggleActivityItem(item.id); }}
                                  className={`flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                                    activityChecked[item.id]
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-white/30 text-transparent group-hover/item:border-white/50'
                                  }`}
                                >
                                  {activityChecked[item.id] && (
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </span>
                                <span className={`${activityChecked[item.id] ? 'text-green-200/70 line-through' : 'text-cyan-100'}`}>
                                  {lookupItemEmoji(item.item_type)} {lookupItemName(item.item_type, item.item_id)}
                                </span>
                              </label>
                            ))
                          ) : (
                            <div className="text-xs text-cyan-200/60 py-1">
                              No activities planned yet.{' '}
                              <Link href="/planner" className="underline text-cyan-200 hover:text-white">
                                Add some in your planner
                              </Link>
                            </div>
                          )
                        ) : (
                          // Check-in sub-items (static)
                          CHECKIN_TASKS.map(task => (
                            <div key={task.id}>
                              <label
                                className="flex items-center gap-2 text-xs cursor-pointer group/item"
                              >
                                <span
                                  onClick={(e) => { e.preventDefault(); toggleCheckinTask(task.id); }}
                                  className={`flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                                    checkinTasks[task.id]
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-white/30 text-transparent group-hover/item:border-white/50'
                                  }`}
                                >
                                  {checkinTasks[task.id] && (
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </span>
                                <span className={`${checkinTasks[task.id] ? 'text-green-200/70 line-through' : 'text-cyan-100'}`}>
                                  {task.label}
                                </span>
                              </label>
                              {task.id === 'pat' && checkinTasks['pat'] && (
                                <div className="ml-6 mt-1.5 mb-0.5">
                                  <select
                                    value={patTime || ''}
                                    onChange={(e) => handlePatTimeChange(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white/10 border border-white/20 rounded-md px-2 py-1 text-xs text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-300"
                                  >
                                    <option value="" disabled className="text-slate-900">Select time...</option>
                                    {PAT_OPTIONS.map(opt => (
                                      <option key={opt.value} value={opt.value} className="text-slate-900">
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Cancellation Policy */}
              {(() => {
                const tiers = isConcierge
                  ? (cruiseNights >= 6 ? CANCELLATION_TIERS_CONCIERGE_LONG : CANCELLATION_TIERS_CONCIERGE_SHORT)
                  : (cruiseNights >= 6 ? CANCELLATION_TIERS_LONG : CANCELLATION_TIERS_SHORT);
                const currentTier = tiers.find(t => daysUntilSailing >= t.min) || tiers[tiers.length - 1];
                const isExpanded = expandedMilestone === 'cancellation';
                return (
                  <div className="pt-1">
                    <button
                      onClick={() => setExpandedMilestone(isExpanded ? null : 'cancellation')}
                      className="w-full flex items-center gap-2.5 text-xs py-1 group"
                    >
                      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-sm">
                        📋
                      </span>
                      <span className="flex-1 text-left text-cyan-100">
                        Cancellation policy
                        {isConcierge && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Concierge</span>}
                      </span>
                      <span className={`flex-shrink-0 font-medium mr-1 ${currentTier.color}`}>
                        {currentTier.desc}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="mt-1 mb-2 ml-6 bg-white/5 rounded-lg p-2.5 space-y-1">
                        {tiers.map((tier, ti) => {
                          const isCurrent = tier === currentTier;
                          return (
                            <div key={ti} className={`flex items-start gap-2 text-xs ${isCurrent ? 'font-medium' : 'opacity-60'}`}>
                              <span className={`flex-shrink-0 mt-0.5 ${tier.color}`}>
                                {isCurrent ? '►' : '·'}
                              </span>
                              <div>
                                <span className={tier.color}>{tier.label}</span>
                                <span className="text-cyan-200/70 ml-1.5">— {tier.desc}</span>
                              </div>
                            </div>
                          );
                        })}
                        <div className="text-[10px] text-cyan-200/40 mt-2 leading-relaxed">
                          {isConcierge
                            ? 'Showing Concierge / Suite policy based on your logged stateroom. Deposits are non-refundable.'
                            : 'Suites & Concierge have stricter policies — deposits may be non-refundable with final payment up to 150 days prior.'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
                const paymentDueDays = nights >= 6 ? 120 : 90;
                const paymentDate = new Date(sailDate);
                paymentDate.setDate(paymentDate.getDate() - paymentDueDays);
                const todayMid = new Date(now);
                todayMid.setHours(0, 0, 0, 0);
                const activityOpen = todayMid >= activityDate;
                const checkInOpen = todayMid >= checkInDate;
                const paymentDue = todayMid >= paymentDate;
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
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${paymentDue ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                          {paymentDue ? '!' : '○'}
                        </span>
                        <span className={paymentDue ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400'}>
                          Payment {paymentDue ? 'due' : paymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
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

      {/* Cruise Info */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 px-1">Plan & Manage Sailings</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2.5 px-1">Track your sailings, explore ships, and look up staterooms.</p>
        <div className="grid grid-cols-2 gap-3">
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
              className="bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800 rounded-2xl p-4 shadow-lg border border-amber-400/30 dark:border-amber-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
            >
              <div className="text-3xl mb-2">🧭</div>
              <div className="text-sm font-bold text-white">My Voyages</div>
              <div className="text-xs text-amber-200 dark:text-amber-300 mt-0.5">Sailing history</div>
            </Link>
          ) : (
            <div className="bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800 rounded-2xl p-4 shadow-lg border border-amber-400/30 dark:border-amber-500/30 text-center opacity-40 cursor-not-allowed">
              <div className="text-3xl mb-2">🧭</div>
              <div className="text-sm font-bold text-white">My Voyages</div>
              <div className="text-xs text-amber-200 dark:text-amber-300 mt-0.5">Sign in required</div>
            </div>
          )}

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
        </div>
      </div>

      {/* Browse Guides */}
      <div className="mt-8">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/Secret-menU/foodies"
            className="bg-white dark:bg-slate-800 rounded-xl p-3.5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-gold transition-all hover:shadow-md flex items-center gap-3"
          >
            <span className="text-2xl">🍽</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Food & Drinks</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Dining & bars</div>
            </div>
          </Link>
          <Link
            href="/Secret-menU/entertainment"
            className="bg-white dark:bg-slate-800 rounded-xl p-3.5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-gold transition-all hover:shadow-md flex items-center gap-3"
          >
            <span className="text-2xl">🎭</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Entertainment</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Shows & nightlife</div>
            </div>
          </Link>
          <Link
            href="/Secret-menU/things-to-do"
            className="bg-white dark:bg-slate-800 rounded-xl p-3.5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-gold transition-all hover:shadow-md flex items-center gap-3"
          >
            <span className="text-2xl">🏊</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Things To Do</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Activities & sports</div>
            </div>
          </Link>
          <Link
            href="/Secret-menU/shopping"
            className="bg-white dark:bg-slate-800 rounded-xl p-3.5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-gold transition-all hover:shadow-md flex items-center gap-3"
          >
            <span className="text-2xl">🛍</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Shopping</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Shops & boutiques</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Disney Magic Culture */}
      <div className="mt-8">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 px-1">Disney Magic Culture</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2.5 px-1">A community built on kindness, love, and dreams — where guests share pixie dust and make magic for each other.</p>
        <div className="grid grid-cols-2 gap-3">
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

          <Link
            href="/Secret-menU/characters"
            className="bg-gradient-to-br from-amber-600 to-yellow-600 dark:from-amber-800 dark:to-yellow-800 rounded-2xl p-4 shadow-lg border border-amber-400/30 dark:border-amber-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
          >
            <div className="text-3xl mb-2">📸</div>
            <div className="text-sm font-bold text-white">Character Checklist</div>
            <div className="text-xs text-amber-200 dark:text-amber-300 mt-0.5">Meet & greets</div>
          </Link>

          <Link
            href="/Secret-menU/movies"
            className="bg-gradient-to-br from-violet-600 to-indigo-600 dark:from-violet-800 dark:to-indigo-800 rounded-2xl p-4 shadow-lg border border-violet-400/30 dark:border-violet-500/30 hover:border-disney-gold transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 text-center"
          >
            <div className="text-3xl mb-2">🎬</div>
            <div className="text-sm font-bold text-white">Movie Checklist</div>
            <div className="text-xs text-violet-200 dark:text-violet-300 mt-0.5">Disney film tracker</div>
          </Link>
        </div>
      </div>

      {/* Community & Tips Section */}
      <div className="mt-8">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/Secret-menU/castaway-wisdom"
            className="bg-white dark:bg-slate-800 rounded-xl p-3.5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-gold transition-all hover:shadow-md flex items-center gap-3"
          >
            <span className="text-2xl">🤍</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Castaway Wisdom</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tips by level</div>
            </div>
          </Link>
          <Link
            href="/Secret-menU/first-timer"
            className="bg-white dark:bg-slate-800 rounded-xl p-3.5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-gold transition-all hover:shadow-md flex items-center gap-3"
          >
            <span className="text-2xl">🌟</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">First-Timer Guide</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">New to cruising</div>
            </div>
          </Link>
          <Link
            href="/Secret-menU/qa"
            className="bg-white dark:bg-slate-800 rounded-xl p-3.5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-gold transition-all hover:shadow-md flex items-center gap-3"
          >
            <span className="text-2xl">💬</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Q&A</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Ask the community</div>
            </div>
          </Link>
          <Link
            href="/Secret-menU/hacks"
            className="bg-white dark:bg-slate-800 rounded-xl p-3.5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-gold transition-all hover:shadow-md flex items-center gap-3"
          >
            <span className="text-2xl">🏴‍☠️</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Cruise Hacks</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tips & tricks</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
