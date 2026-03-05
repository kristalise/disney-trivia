'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import SailingPicker from '@/components/SailingPicker';
import { getCharacterCategories, getCharacterById } from '@/lib/character-data';
import { getAllFoodieVenues, getFoodieCategories, getFoodieVenueById, getAdventureRotation } from '@/lib/foodie-data';
import { getAllExperiences, getEntertainmentCategories, getExperienceById } from '@/lib/entertainment-data';
import { getAllActivities as getAllThingsToDo, getActivityCategories, getActivityById as getThingsToDoById } from '@/lib/things-to-do-data';
import { getAllShops, getShopCategories, getShopById } from '@/lib/shopping-data';
import TravelPartyPanel, { CompanionPlan } from '@/components/TravelPartyPanel';

interface Sailing {
  id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
  itinerary_name: string | null;
  embarkation_port: string;
  ports_of_call: string | null;
  disembarkation_port: string | null;
  stateroom_numbers: number[] | null;
  num_pax: number | null;
  cost_per_pax: number | null;
  overall_rating: number;
  role?: 'owner' | 'guest';
}

type ItemType = 'character' | 'dining' | 'entertainment' | 'activity' | 'shopping';

interface PlannerItem {
  id: string;
  sailing_id: string;
  item_type: string;
  item_id: string;
  checked: boolean;
  notes: string | null;
  created_at: string;
}

interface LookupEntry {
  name: string;
  category: string;
  description: string;
  emoji: string;
}

interface CharacterMeetup {
  id: string;
  character_id: string;
  sailing_id: string;
  photo_url: string | null;
}

// Cross-type map: dining venues that also appear in entertainment/character sections
const CROSS_TYPE_MAP = (() => {
  const diningCrossRefs = new Map<string, { entertainment: boolean; character: boolean }>();
  const entToDining = new Map<string, string>();

  const allFoodie = getAllFoodieVenues();
  const allEnt = getAllExperiences();

  for (const venue of allFoodie) {
    if (venue.characterExperience || venue.liveEntertainment) {
      diningCrossRefs.set(venue.id, {
        entertainment: venue.liveEntertainment,
        character: venue.characterExperience,
      });
      // Find matching entertainment item by name
      const match = allEnt.find(e => e.name === venue.name && e.types.includes('dining'));
      if (match) {
        entToDining.set(match.id, venue.id);
      }
    }
  }

  return { diningCrossRefs, entToDining };
})();

function idToName(id: string): string {
  return id.split('-').map((w, i) => {
    if (['and', 'of', 'the', 'at', 'in', 'on', 'for'].includes(w) && i > 0) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

function lookupItem(itemType: string, itemId: string): LookupEntry {
  if (itemType === 'character') {
    const ch = getCharacterById(itemId);
    return ch ? { name: ch.name, category: 'Character', description: '', emoji: '📸' } : { name: idToName(itemId), category: 'Character', description: '', emoji: '📸' };
  }
  if (itemType === 'dining') {
    const fv = getFoodieVenueById(itemId);
    if (fv) return { name: fv.name, category: 'Dining', description: fv.description, emoji: '🍽️' };
    return { name: idToName(itemId), category: 'Dining', description: '', emoji: '🍽️' };
  }
  if (itemType === 'entertainment') {
    const exp = getExperienceById(itemId);
    if (exp) return { name: exp.name, category: 'Entertainment', description: exp.description, emoji: '🎭' };
    return { name: idToName(itemId), category: 'Entertainment', description: '', emoji: '🎭' };
  }
  if (itemType === 'activity') {
    const act = getThingsToDoById(itemId);
    if (act) return { name: act.name, category: 'Activity', description: act.description, emoji: '🎢' };
    return { name: idToName(itemId), category: 'Activity', description: '', emoji: '🎢' };
  }
  if (itemType === 'shopping') {
    const shop = getShopById(itemId);
    if (shop) return { name: shop.name, category: 'Shopping', description: shop.description, emoji: '🛍️' };
    return { name: idToName(itemId), category: 'Shopping', description: '', emoji: '🛍️' };
  }
  return { name: idToName(itemId), category: itemType, description: '', emoji: '📌' };
}

export default function PlannerPage() {
  return (
    <Suspense>
      <PlannerContent />
    </Suspense>
  );
}

function PlannerContent() {
  const { user, session } = useAuth();
  const searchParams = useSearchParams();
  const sailingParam = searchParams.get('sailing');

  const [selectedSailing, setSelectedSailing] = useState<Sailing | null>(null);
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingSection, setAddingSection] = useState<ItemType | null>(null);
  const [addSearch, setAddSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Dining review prompt modal
  const [reviewPromptItem, setReviewPromptItem] = useState<PlannerItem | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewAnonymous, setReviewAnonymous] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Adventure rotation state
  const [adventureRotation, setAdventureRotation] = useState<number | null>(null);
  const [rotationLoading, setRotationLoading] = useState(false);

  // Travel party state
  const [companions, setCompanions] = useState<CompanionPlan[]>([]);
  const [companionsLoading, setCompanionsLoading] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  // Character meetup photo state
  const [characterMeetups, setCharacterMeetups] = useState<Record<string, CharacterMeetup>>({});
  const [uploadingCharacter, setUploadingCharacter] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCharacterIdRef = useRef<string | null>(null);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  const authHeader = useCallback(() => ({
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session?.access_token]);

  const fetchPlannerItems = useCallback(async (sailingId: string) => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/planner-items?sailing_id=${sailingId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlannerItems(data.items ?? []);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [session?.access_token]);

  // Fetch character meetups for current sailing
  const fetchCharacterMeetups = useCallback(async (sailingId: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/character-meetups', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const meetups = (data.meetups ?? []) as CharacterMeetup[];
        const map: Record<string, CharacterMeetup> = {};
        for (const m of meetups) {
          if (m.sailing_id === sailingId) {
            map[m.character_id] = m;
          }
        }
        setCharacterMeetups(map);
      }
    } catch { /* ignore */ }
  }, [session?.access_token]);

  const fetchCompanions = useCallback(async (sailingId: string) => {
    if (!session?.access_token) return;
    setCompanionsLoading(true);
    try {
      const res = await fetch(`/api/planner-items/companions?sailing_id=${sailingId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCompanions(data.companions ?? []);
      }
    } catch { /* ignore */ } finally { setCompanionsLoading(false); }
  }, [session?.access_token]);

  const handleDuplicate = async (sourceUserId: string, options: { planner: boolean; checklist: boolean; rotation: boolean }) => {
    if (!selectedSailing || !session?.access_token) return { planner_items: 0, checklist_items: 0, rotation: null as number | null };
    setDuplicating(sourceUserId);
    try {
      const res = await fetch('/api/planner-items/companions', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          sailing_id: selectedSailing.id,
          source_user_id: sourceUserId,
          include_planner: options.planner,
          include_checklist: options.checklist,
          include_rotation: options.rotation,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Re-fetch planner items to reflect changes
        await fetchPlannerItems(selectedSailing.id);
        // If rotation was copied, update local state
        if (data.copied.rotation !== null) {
          setAdventureRotation(data.copied.rotation);
        }
        return data.copied;
      }
    } catch { /* ignore */ } finally { setDuplicating(null); }
    return { planner_items: 0, checklist_items: 0, rotation: null };
  };

  const handleToggleCheck = async (item: PlannerItem) => {
    // If checking off a dining item, show review prompt
    if (item.item_type === 'dining' && !item.checked) {
      setReviewPromptItem(item);
      setReviewRating(0);
      setReviewText('');
      setReviewAnonymous(false);
      return;
    }
    setTogglingId(item.id);
    try {
      const res = await fetch('/api/planner-items', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ id: item.id, checked: !item.checked }),
      });
      if (res.ok) {
        setPlannerItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i));
      }
    } catch { /* ignore */ } finally { setTogglingId(null); }
  };

  // Mark dining item as done (skip review)
  const handleDiningSkipReview = async () => {
    if (!reviewPromptItem) return;
    setTogglingId(reviewPromptItem.id);
    try {
      const res = await fetch('/api/planner-items', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ id: reviewPromptItem.id, checked: true }),
      });
      if (res.ok) {
        setPlannerItems(prev => prev.map(i => i.id === reviewPromptItem.id ? { ...i, checked: true } : i));
      }
    } catch { /* ignore */ } finally { setTogglingId(null); setReviewPromptItem(null); }
  };

  // Submit dining review and mark as done
  const handleDiningSubmitReview = async () => {
    if (!reviewPromptItem || !selectedSailing || reviewRating === 0) return;
    setReviewSubmitting(true);
    try {
      await fetch('/api/foodie-reviews', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          venue_id: reviewPromptItem.item_id,
          sailing_id: selectedSailing.id,
          rating: reviewRating,
          review_text: reviewText || undefined,
          is_anonymous: reviewAnonymous,
        }),
      });
      const res = await fetch('/api/planner-items', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ id: reviewPromptItem.id, checked: true }),
      });
      if (res.ok) {
        setPlannerItems(prev => prev.map(i => i.id === reviewPromptItem.id ? { ...i, checked: true } : i));
      }
    } catch { /* ignore */ } finally { setReviewSubmitting(false); setReviewPromptItem(null); }
  };

  // Adventure rotation
  const handleSetAdventureRotation = async (rotation: number) => {
    if (!selectedSailing) return;
    setRotationLoading(true);
    try {
      const res = await fetch('/api/adventure-rotation', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ sailing_id: selectedSailing.id, rotation }),
      });
      if (res.ok) {
        const oldRotation = adventureRotation;
        setAdventureRotation(rotation);

        // Remove old rotation restaurants if swapping
        if (oldRotation !== null && oldRotation !== rotation) {
          const oldVenueIds = getAdventureRotation(oldRotation);
          for (const venueId of oldVenueIds) {
            const existing = plannerItems.find(i => i.item_type === 'dining' && i.item_id === venueId);
            if (existing) {
              await fetch(`/api/planner-items?id=${existing.id}`, {
                method: 'DELETE',
                headers: headers(),
              }).catch(() => {});
              setPlannerItems(prev => prev.filter(i => i.id !== existing.id));
            }
          }
        }

        // Add new rotation restaurants
        const newVenueIds = getAdventureRotation(rotation);
        const currentIds = new Set(plannerItems.map(i => `${i.item_type}:${i.item_id}`));
        for (const venueId of newVenueIds) {
          if (!currentIds.has(`dining:${venueId}`)) {
            await fetch('/api/planner-items', {
              method: 'POST',
              headers: headers(),
              body: JSON.stringify({ sailing_id: selectedSailing.id, item_type: 'dining', item_id: venueId }),
            }).then(async r => {
              if (r.ok) {
                const data = await r.json();
                setPlannerItems(prev => {
                  if (prev.some(i => i.id === data.item.id)) return prev;
                  return [...prev, data.item];
                });
              }
            }).catch(() => {});
          }
        }
      }
    } catch { /* ignore */ } finally { setRotationLoading(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/planner-items?id=${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok) {
        setPlannerItems(prev => prev.filter(i => i.id !== id));
      }
    } catch { /* ignore */ } finally { setDeletingId(null); }
  };

  const handleAdd = async (itemType: ItemType, itemId: string) => {
    if (!selectedSailing) return;
    setAddingItemId(itemId);
    // If adding entertainment item that cross-refs to dining, store as dining
    let actualType: ItemType = itemType;
    let actualId = itemId;
    if (itemType === 'entertainment') {
      const diningId = CROSS_TYPE_MAP.entToDining.get(itemId);
      if (diningId) { actualType = 'dining'; actualId = diningId; }
    }
    try {
      const res = await fetch('/api/planner-items', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ sailing_id: selectedSailing.id, item_type: actualType, item_id: actualId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlannerItems(prev => {
          if (prev.some(i => i.id === data.item.id)) return prev;
          return [...prev, data.item];
        });
      }
    } catch { /* ignore */ } finally { setAddingItemId(null); }
  };

  // Character photo upload
  const handlePhotoUpload = (characterId: string) => {
    uploadCharacterIdRef.current = characterId;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const characterId = uploadCharacterIdRef.current;
    if (!file || !characterId || !selectedSailing || !session?.access_token) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be under 5MB');
      return;
    }

    setUploadingCharacter(characterId);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `character-meetups/${user!.id}/${selectedSailing.id}/${characterId}.${ext}`;

      // Upload to Supabase storage
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/character-meetups/${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        // Try upsert
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/character-meetups/${path}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: file,
        });
      }

      const photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/character-meetups/${path}`;

      // Create/update meetup record
      const res = await fetch('/api/character-meetups', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          character_id: characterId,
          sailing_id: selectedSailing.id,
          photo_url: photoUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCharacterMeetups(prev => ({ ...prev, [characterId]: data.meetup }));
      }
    } catch { /* ignore */ } finally {
      setUploadingCharacter(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Auto-populate rotational dining when sailing loads
  const autoPopulateDining = useCallback(async (sailing: Sailing, currentItems: PlannerItem[]) => {
    if (sailing.ship_name === 'Disney Adventure') return; // Handled by rotation picker
    const existingIds = new Set(currentItems.map(i => `${i.item_type}:${i.item_id}`));
    const rotationalVenues = getAllFoodieVenues().filter(
      v => v.category === 'rotational' && v.ships.includes(sailing.ship_name)
    );
    for (const venue of rotationalVenues) {
      if (!existingIds.has(`dining:${venue.id}`)) {
        try {
          const res = await fetch('/api/planner-items', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ sailing_id: sailing.id, item_type: 'dining', item_id: venue.id }),
          });
          if (res.ok) {
            const data = await res.json();
            setPlannerItems(prev => {
              if (prev.some(i => i.id === data.item.id)) return prev;
              return [...prev, data.item];
            });
          }
        } catch { /* ignore */ }
      }
    }
  }, [headers]);

  // Group items by type
  const characterItems = useMemo(() => {
    const items = plannerItems.filter(i => {
      if (i.item_type === 'character') return true;
      if (i.item_type === 'dining') {
        return CROSS_TYPE_MAP.diningCrossRefs.get(i.item_id)?.character === true;
      }
      return false;
    });
    return [...items.filter(i => !i.checked), ...items.filter(i => i.checked)];
  }, [plannerItems]);

  const diningItems = useMemo(() => {
    const items = plannerItems.filter(i => i.item_type === 'dining');
    return [...items.filter(i => !i.checked), ...items.filter(i => i.checked)];
  }, [plannerItems]);

  const entertainmentItems = useMemo(() => {
    const items = plannerItems.filter(i => {
      if (i.item_type === 'entertainment') return true;
      if (i.item_type === 'dining') {
        return CROSS_TYPE_MAP.diningCrossRefs.get(i.item_id)?.entertainment === true;
      }
      return false;
    });
    return [...items.filter(i => !i.checked), ...items.filter(i => i.checked)];
  }, [plannerItems]);

  const activityItems = useMemo(() => {
    const items = plannerItems.filter(i => i.item_type === 'activity');
    return [...items.filter(i => !i.checked), ...items.filter(i => i.checked)];
  }, [plannerItems]);

  const shoppingItems = useMemo(() => {
    const items = plannerItems.filter(i => i.item_type === 'shopping');
    return [...items.filter(i => !i.checked), ...items.filter(i => i.checked)];
  }, [plannerItems]);

  // Progress
  const relevantItems = plannerItems.filter(i => ['character', 'dining', 'entertainment', 'activity', 'shopping'].includes(i.item_type));
  const totalItems = relevantItems.length;
  const checkedItems = relevantItems.filter(i => i.checked).length;
  const progressPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const shipName = selectedSailing?.ship_name ?? '';
  const existingItemIds = useMemo(() => new Set(plannerItems.map(i => `${i.item_type}:${i.item_id}`)), [plannerItems]);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const isPastSailing = selectedSailing ? new Date(selectedSailing.sail_end_date) < new Date() : false;

  // Fetch adventure rotation for Adventure sailings
  useEffect(() => {
    if (!selectedSailing || selectedSailing.ship_name !== 'Disney Adventure' || !session?.access_token) {
      setAdventureRotation(null);
      return;
    }
    fetch(`/api/adventure-rotation?sailing_id=${selectedSailing.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => setAdventureRotation(data?.rotation ?? null))
      .catch(() => {});
  }, [selectedSailing, session?.access_token]);

  // Fetch character meetups when sailing changes
  useEffect(() => {
    if (selectedSailing) {
      fetchCharacterMeetups(selectedSailing.id);
    } else {
      setCharacterMeetups({});
    }
  }, [selectedSailing, fetchCharacterMeetups]);

  // Auto-populate rotational dining when items finish loading
  const hasAutoPopulated = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedSailing || loading) return;
    if (hasAutoPopulated.current === selectedSailing.id) return;
    hasAutoPopulated.current = selectedSailing.id;
    autoPopulateDining(selectedSailing, plannerItems);
  }, [selectedSailing, loading, plannerItems, autoPopulateDining]);

  // Available items for add panels
  const getAvailableItems = useCallback((type: ItemType): Array<{ id: string; name: string; description: string; category?: string }> => {
    if (!shipName) return [];
    let source: Array<{ id: string; name: string; description: string; category?: string }> = [];

    if (type === 'character') {
      const cats = getCharacterCategories();
      const seen = new Set<string>();
      const chars: Array<{ id: string; name: string; description: string; category?: string }> = [];
      for (const cat of cats) {
        for (const sub of cat.subcategories) {
          for (const ch of sub.characters) {
            if (!seen.has(ch.id)) {
              seen.add(ch.id);
              chars.push({ id: ch.id, name: ch.name, description: `${cat.label} - ${sub.label}`, category: cat.label });
            }
          }
        }
      }
      source = chars;
    } else if (type === 'dining') {
      source = getAllFoodieVenues()
        .filter(v => v.ships.includes(shipName))
        .map(v => ({ id: v.id, name: v.name, description: v.description, category: v.category }));
    } else if (type === 'entertainment') {
      source = getAllExperiences()
        .filter(e => e.ships.includes(shipName))
        .map(e => ({ id: e.id, name: e.name, description: e.description, category: e.types[0] }));
      // Exclude entertainment items whose dining cross-ref is already in the planner
      source = source.filter(item => {
        const diningId = CROSS_TYPE_MAP.entToDining.get(item.id);
        return !(diningId && existingItemIds.has(`dining:${diningId}`));
      });
    } else if (type === 'activity') {
      source = getAllThingsToDo()
        .filter(a => a.ships.includes(shipName))
        .map(a => ({ id: a.id, name: a.name, description: a.description, category: a.category }));
    } else if (type === 'shopping') {
      source = getAllShops()
        .filter(s => s.ships.includes(shipName))
        .map(s => ({ id: s.id, name: s.name, description: s.description, category: s.category }));
    }

    source = source.filter(item => !existingItemIds.has(`${type}:${item.id}`));
    if (addSearch.trim()) {
      const q = addSearch.toLowerCase();
      source = source.filter(item => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
    }
    return source;
  }, [shipName, existingItemIds, addSearch]);

  // Render a checklist item row
  function ItemRow({ item, sectionType }: { item: PlannerItem; sectionType?: string }) {
    const info = lookupItem(item.item_type, item.item_id);
    const isCharacter = item.item_type === 'character';
    const meetup = isCharacter ? characterMeetups[item.item_id] : null;

    // Cross-type badge: show when a dining item appears in a non-dining section
    const crossRef = item.item_type === 'dining' ? CROSS_TYPE_MAP.diningCrossRefs.get(item.item_id) : null;
    const showCrossBadge = crossRef && sectionType && sectionType !== 'dining';

    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
        <button
          type="button"
          disabled={togglingId === item.id}
          onClick={() => handleToggleCheck(item)}
          className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
            item.checked
              ? 'bg-disney-blue border-disney-blue dark:bg-disney-gold dark:border-disney-gold'
              : 'border-slate-300 dark:border-slate-600 hover:border-disney-blue dark:hover:border-disney-gold'
          } ${togglingId === item.id ? 'opacity-50' : ''}`}
        >
          {item.checked && (
            <svg className="w-4 h-4 text-white dark:text-slate-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Photo thumbnail for characters */}
        {isCharacter && meetup?.photo_url && (
          <img src={meetup.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${item.checked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
            {info.name}
            {showCrossBadge && (
              <span className="ml-1.5 text-[10px] font-normal text-slate-400 dark:text-slate-500" title="Also in Foodie Plan">
                {sectionType === 'entertainment' ? '🍽️🎭' : '🍽️📸'}
              </span>
            )}
          </p>
          {info.description && <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{info.description}</p>}
        </div>

        {/* Character photo upload button */}
        {isCharacter && !item.checked && (
          <button
            type="button"
            disabled={uploadingCharacter === item.item_id}
            onClick={() => handlePhotoUpload(item.item_id)}
            className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
              meetup?.photo_url
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-disney-blue dark:hover:text-disney-gold'
            } ${uploadingCharacter === item.item_id ? 'opacity-50 animate-pulse' : ''}`}
            title={meetup?.photo_url ? 'Replace photo' : 'Upload photo'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        <button
          type="button"
          disabled={deletingId === item.id}
          onClick={() => handleDelete(item.id)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          title="Remove from planner"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    );
  }

  function CharacterSection() {
    const isCollapsed = collapsedSections.has('character');
    const isAddOpen = addingSection === 'character';
    const available = isAddOpen ? getAvailableItems('character') : [];
    const items = characterItems;
    const characterOnly = items.filter(i => i.item_type === 'character');
    const diningExperiences = items.filter(i => i.item_type === 'dining');

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <button type="button" onClick={() => toggleSection('character')} className="flex items-center gap-2 flex-1 min-w-0 text-left">
            <span className="text-lg">📸</span>
            <h3 className="font-bold text-slate-900 dark:text-white">Characters to Meet</h3>
            <span className="text-sm text-slate-400 dark:text-slate-500">({items.length})</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => { setAddingSection(isAddOpen ? null : 'character'); setAddSearch(''); }}
            className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${isAddOpen ? 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300' : 'bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20'}`}
          >
            {isAddOpen ? 'Close' : '+ Add'}
          </button>
        </div>

        {isAddOpen && (
          <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-700">
            <input
              type="text"
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              placeholder="Search characters..."
              className="w-full mt-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
            />
            <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
              {available.length > 0 ? available.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                    {item.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.description}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={addingItemId === item.id}
                    onClick={() => handleAdd('character', item.id)}
                    className="ml-2 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  {addSearch ? 'No matching characters found.' : 'All characters already added!'}
                </p>
              )}
            </div>
          </div>
        )}

        {!isCollapsed && (
          <div className="px-5 pb-4">
            {items.length > 0 ? (
              <>
                {characterOnly.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {characterOnly.map(item => {
                      const info = lookupItem('character', item.item_id);
                      const meetup = characterMeetups[item.item_id];
                      const hasPhoto = !!meetup?.photo_url;
                      const isUploading = uploadingCharacter === item.item_id;

                      return (
                        <div key={item.id} className="flex flex-col items-center w-16 group relative">
                          {/* Bubble */}
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => handlePhotoUpload(item.item_id)}
                            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                              hasPhoto
                                ? 'ring-2 ring-green-400 dark:ring-green-500'
                                : 'shadow-inner bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-500 hover:border-disney-blue dark:hover:border-disney-gold'
                            } ${isUploading ? 'opacity-50 animate-pulse' : ''}`}
                            title={hasPhoto ? `${info.name} — tap to replace photo` : `${info.name} — tap to upload photo`}
                          >
                            {hasPhoto ? (
                              <img src={meetup!.photo_url!} alt={info.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                            {hasPhoto && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </button>
                          {/* Name */}
                          <span className={`text-[10px] mt-1 text-center leading-tight line-clamp-2 ${hasPhoto ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                            {info.name}
                          </span>
                          {/* Remove button */}
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item.id)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Dining experiences with character interactions */}
                {diningExperiences.length > 0 && (
                  <div className={characterOnly.length > 0 ? 'mt-3 pt-3 border-t border-slate-100 dark:border-slate-700' : ''}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1">Character Dining</p>
                    {diningExperiences.map(item => <ItemRow key={item.id} item={item} sectionType="character" />)}
                  </div>
                )}
                <Link
                  href="/Secret-menU/characters"
                  className="block mt-3 text-center text-xs text-disney-blue dark:text-disney-gold hover:underline"
                >
                  View Character Checklist
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No characters added — <Link href="/Secret-menU/characters" className="text-disney-blue dark:text-disney-gold hover:underline">browse the Character Checklist</Link> to discover who you can meet!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function PlanSection({ type, emoji, title, items, explorerLink, explorerName, emptyHint }: {
    type: ItemType;
    emoji: string;
    title: string;
    items: PlannerItem[];
    explorerLink: string;
    explorerName: string;
    emptyHint?: string;
  }) {
    const isCollapsed = collapsedSections.has(type);
    const isAddOpen = addingSection === type;
    const available = isAddOpen ? getAvailableItems(type) : [];

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <button type="button" onClick={() => toggleSection(type)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
            <span className="text-lg">{emoji}</span>
            <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
            <span className="text-sm text-slate-400 dark:text-slate-500">({items.length})</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => { setAddingSection(isAddOpen ? null : type); setAddSearch(''); }}
            className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${isAddOpen ? 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300' : 'bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20'}`}
          >
            {isAddOpen ? 'Close' : '+ Add'}
          </button>
        </div>

        {isAddOpen && (
          <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-700">
            <input
              type="text"
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full mt-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent"
            />
            <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
              {available.length > 0 ? available.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                    {item.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.description}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={addingItemId === item.id}
                    onClick={() => handleAdd(type, item.id)}
                    className="ml-2 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  {addSearch ? 'No matching items found.' : 'All items already added!'}
                </p>
              )}
            </div>
          </div>
        )}

        {!isCollapsed && (
          <div className="px-5 pb-4">
            {items.length > 0 ? (
              <div className="space-y-0">
                {items.map(item => <ItemRow key={item.id} item={item} sectionType={type} />)}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {emptyHint || <>No items yet — <Link href={explorerLink} className="text-disney-blue dark:text-disney-gold hover:underline">browse {explorerName}</Link> to add some!</>}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hidden file input for character photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="mb-8">
        <Link href={user ? `/profile/${user.id}` : '/Secret-menU'} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {user ? 'My Profile' : 'Cruise Guide'}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">My Planner</h1>
        <p className="text-slate-600 dark:text-slate-400">Plan your perfect cruise day with a personal checklist.</p>
      </div>

      {/* Sailing Picker */}
      {user ? (
        <SailingPicker
          hidePast
          onSelect={async (sailing) => {
            setSelectedSailing(sailing);
            setPlannerItems([]);
            setCompanions([]);
            setAddingSection(null);
            if (sailing) {
              await fetchPlannerItems(sailing.id);
              fetchCompanions(sailing.id);
            }
          }}
          selectedSailingId={selectedSailing?.id ?? sailingParam}
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Sign in to use the planner.</p>
          <Link href="/auth" className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney">Sign In</Link>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3 animate-pulse">🗓</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading your planner...</p>
        </div>
      )}

      {/* Content — only when sailing selected and not loading */}
      {selectedSailing && !loading && (
        <>
          {/* Pre-Cruise & Pixie Dust Links */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Link
              href={`/planner/pre-cruise?sailing=${selectedSailing.id}`}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-blue/30 dark:hover:border-disney-gold/30 transition-colors"
            >
              <div className="text-2xl mb-2">📋</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pre-Cruise Checklist</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pack, purchase &amp; prep</p>
            </Link>
            <Link
              href={`/planner/pixie-dust?sailing=${selectedSailing.id}`}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-disney-blue/30 dark:hover:border-disney-gold/30 transition-colors"
            >
              <div className="text-2xl mb-2">✨</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pixie Dusting</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">FE groups &amp; gift delivery</p>
            </Link>
          </div>

          {/* Progress bar */}
          {totalItems > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {checkedItems} of {totalItems} completed
                </span>
                <span className="text-sm font-bold text-disney-blue dark:text-disney-gold">{progressPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-disney-blue dark:bg-disney-gold rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Travel Party */}
          {(companions.length > 0 || companionsLoading) && (
            <TravelPartyPanel
              companions={companions}
              loading={companionsLoading}
              isAdventure={selectedSailing.ship_name === 'Disney Adventure'}
              onDuplicate={handleDuplicate}
              duplicating={duplicating}
              lookupItem={(itemType, itemId) => {
                const info = lookupItem(itemType, itemId);
                return { name: info.name, category: info.category, emoji: info.emoji };
              }}
            />
          )}

          {/* Adventure Rotation Picker */}
          {selectedSailing.ship_name === 'Disney Adventure' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-amber-300 dark:border-amber-600 mb-4 overflow-hidden p-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                🍽️ {adventureRotation ? `Rotation ${adventureRotation}` : 'Which dining rotation were you assigned?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {adventureRotation
                  ? 'Tap the other rotation to swap if your assignment changed.'
                  : 'Selecting your rotation will add your rotational restaurants to the planner.'}
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={rotationLoading || adventureRotation === 1}
                  onClick={() => handleSetAdventureRotation(1)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors disabled:opacity-70 ${
                    adventureRotation === 1
                      ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">Rotation 1</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pixar Market, Navigator&apos;s Club, Animator&apos;s Palate</div>
                    </div>
                    {adventureRotation === 1 && (
                      <span className="flex-shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">Selected</span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  disabled={rotationLoading || adventureRotation === 2}
                  onClick={() => handleSetAdventureRotation(2)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors disabled:opacity-70 ${
                    adventureRotation === 2
                      ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">Rotation 2</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enchanted Summer, Hollywood Spotlight Club, Animator&apos;s Table</div>
                    </div>
                    {adventureRotation === 2 && (
                      <span className="flex-shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">Selected</span>
                    )}
                  </div>
                </button>
              </div>
              {rotationLoading && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center animate-pulse">Updating restaurants...</p>
              )}
            </div>
          )}

          {/* Sections */}
          <CharacterSection />
          <PlanSection
            type="dining"
            emoji="🍽️"
            title="Foodie Plan"
            items={diningItems}
            explorerLink="/Secret-menU/foodies"
            explorerName="Foodie Guide"
          />
          <PlanSection
            type="entertainment"
            emoji="🎭"
            title="Entertainment Plan"
            items={entertainmentItems}
            explorerLink="/Secret-menU/entertainment"
            explorerName="Entertainment Guide"
          />
          <PlanSection
            type="activity"
            emoji="🎢"
            title="Activity Plan"
            items={activityItems}
            explorerLink="/Secret-menU/things-to-do"
            explorerName="Activity Guide"
          />
          <PlanSection
            type="shopping"
            emoji="🛍️"
            title="Shopping Plan"
            items={shoppingItems}
            explorerLink="/Secret-menU/shopping"
            explorerName="Shopping Guide"
          />

          {/* Bottom link to Review Hub for past sailings */}
          {isPastSailing && (
            <Link
              href={`/Secret-menU/sailing/${selectedSailing.id}/review`}
              className="block mt-4 text-center px-6 py-3 rounded-2xl font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20 transition-colors"
            >
              Review this sailing &rarr;
            </Link>
          )}
        </>
      )}

      {/* Dining Review Prompt Modal */}
      {reviewPromptItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                How was {lookupItem('dining', reviewPromptItem.item_id).name}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Rate your experience or skip to mark as done.</p>

              <div className="mb-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-2xl cursor-pointer hover:scale-110 transition-transform"
                    >
                      {star <= reviewRating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value.slice(0, 1000))}
                rows={3}
                placeholder="Share your experience (optional)..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white resize-none mb-3"
              />

              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reviewAnonymous}
                  onChange={e => setReviewAnonymous(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">Post anonymously</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDiningSkipReview}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Mark as done
                </button>
                <button
                  type="button"
                  disabled={reviewSubmitting || reviewRating === 0}
                  onClick={handleDiningSubmitReview}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Saving...' : 'Submit Review'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setReviewPromptItem(null)}
                className="w-full mt-2 text-center text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
