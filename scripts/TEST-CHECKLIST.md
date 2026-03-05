# Test Checklist

Login: **kristabelq@gmail.com** (your existing account)

## Seeded Data Summary
- 27 sailings (26 past + 1 upcoming Disney Wish)
- B2B sailings: Disney Treasure Jan 5-12 + Jan 12-19
- 7 venue reviews, 6 dining reviews, 4 activity reviews, 3 foodie reviews
- 3 stateroom reviews, 3 cruise hack reviews
- 9 character meetups across 4 sailings
- 23 movie checklist entries (18 watched, 5 want to watch)
- 17 planner items (12 upcoming + 5 past checked)
- 15 pre-cruise checklist items
- 1 FE group (code: WISH2026), 2 pixie gifts (5 recipients, 2 delivered)

---

## 1. Secret Menu Hub (`/Secret-menU`)

### Auth Gating
- [ ] **Signed out**: Venue Guide, Ship Guide, Cruise Guide, Stateroom Guide are accessible (not greyed out)
- [ ] **Signed out**: My Voyages, Friendship, Pixie Dust, Character, Movie, Entertainment, Activity, Foodie, Shopping show "Sign in required" and are greyed out
- [ ] **Signed in**: All cards are accessible

### Upcoming Sailings
- [ ] Collapsible "Upcoming Sailings" section appears when signed in
- [ ] Shows upcoming Disney Wish sailing with correct dates
- [ ] Shows check-in and activity booking dates based on Castaway level
- [ ] Check-in/activity dates show "Open!" badge if date has passed

---

## 2. My Voyages (`/Secret-menU/sailing`)

### Sailing List
- [ ] Shows all 27 sailings (26 past + 1 upcoming)
- [ ] Upcoming sailing appears in "Upcoming" section
- [ ] Past sailings sorted by date descending
- [ ] Each card shows ship name, dates, port, stateroom

### Sailing Detail (`/Secret-menU/sailing/[id]`)
- [ ] Shows full sailing details (ship, dates, ports, stateroom, party size)
- [ ] Star ratings display correctly (4-5 stars on past sailings)
- [ ] Upcoming sailing shows no ratings (null)

### Add New Sailing
- [ ] Can create new sailing with all required fields
- [ ] **Edge Case - Overlap**: Try creating a sailing that overlaps an existing one → should be rejected
- [ ] **Edge Case - B2B**: Try creating a sailing where start_date = end_date of existing → should succeed

### Delete Sailing
- [ ] Delete button appears on sailing detail page
- [ ] Must type "confirm" to enable delete button
- [ ] Cancelling resets the confirm text
- [ ] Deleting cascades: removes planner items, reviews, companions for that sailing

---

## 3. Venue Guide (`/Secret-menU/venues`)

- [ ] Browse all venues with category filters
- [ ] Search filters venues by name
- [ ] Click venue → goes to venue detail page
- [ ] Ship-specific venue pages show reviews
- [ ] KristabelQ's reviews appear on Palo (Wish, Fantasy, Treasure), AquaMouse (Wish), Nightingales (Wish), Satellite Falls (Fantasy), Haunted Mansion Parlor (Treasure)

### Write Venue Review
- [ ] Can write a review for a venue on a past sailing
- [ ] Star ratings (overall, atmosphere, theming) work
- [ ] "Visited with" tags toggle correctly
- [ ] **Edge Case**: Cannot submit duplicate review for same venue + sailing (unique constraint)

---

## 4. Dining Guide (`/Secret-menU/dining`)

- [ ] Browse restaurants with type filters
- [ ] Reviews display with sailing context
- [ ] KristabelQ has reviews for Arendelle, Animator's Palate, Worlds of Marvel, 1923, Enchanted Garden, Palo
- [ ] Dietary restrictions picker works
- [ ] **Edge Case**: Unique constraint prevents duplicate review per restaurant per sailing

---

## 5. Activity Guide (`/Secret-menU/activity`)

- [ ] Browse activities by type
- [ ] Reviews display correctly
- [ ] Age group recommendations show
- [ ] KristabelQ has reviews for AquaDuck, Pirate Night (Fantasy + Treasure), AquaMouse

---

## 6. Foodie Guide (`/Secret-menU/foodies`)

- [ ] Browse foodie venues with ship ratings
- [ ] Reviews show with star ratings
- [ ] KristabelQ has reviews for 1923 (2 reviews on B2B sailings), Palo

---

## 7. Character Checklist (`/Secret-menU/characters`)

- [ ] Shows all Disney characters organized by category
- [ ] Characters with meetups show met status
- [ ] KristabelQ has met: Captain Mickey (2 sailings), Cinderella, Rapunzel, Mickey, Goofy, Elsa, Anna, Minnie
- [ ] Default meetup photo displays correctly
- [ ] Can toggle which meetup is the default

---

## 8. Movie Checklist (`/Secret-menU/movies`)

### Browse & Filter
- [ ] Upcoming movies section at top, sorted by release date
- [ ] Released movies grouped by studio
- [ ] Search filters by title
- [ ] Studio filter pills work
- [ ] Status filter shows "Want to Watch (5)" and "Watched (18)"

### Progress
- [ ] Progress card shows "18 of XX watched" with progress bar

### Interactions
- [ ] "Want to Watch" button toggles correctly
- [ ] "Watched" button shows star rating row
- [ ] Star rating saves immediately
- [ ] Tapping same status again removes the entry
- [ ] **Edge Case**: Can mark a "watched" movie as "want to watch" (re-watch)

---

## 9. Planner (`/planner`)

### Upcoming Sailing Planner
- [ ] Shows planner items for upcoming Wish sailing
- [ ] 12 items: venues, dining, activities, characters, entertainment
- [ ] Checkboxes toggle items as checked/unchecked
- [ ] Notes can be added to items

### Past Sailing Planner
- [ ] Shows 5 checked items for recent past sailing
- [ ] Checked items display correctly

### Planner Status Integration
- [ ] Items with reviews show "Reviewed" status
- [ ] Checked items without reviews show "To Review" status
- [ ] Unchecked items show "Added" status
- [ ] **Edge Case**: Status cascades across venue_reviews, dining_reviews, activity_reviews, foodie_reviews

---

## 10. Pixie Dust (`/planner/pixie-dust`)

### FE Groups
- [ ] Shows "Wish Magic FE Group" (code: WISH2026)
- [ ] Member count shows correctly
- [ ] Invite code displays for sharing

### Gifts
- [ ] Shows "Welcome Aboard Bags" and "Door Magnets"
- [ ] Recipients list shows 5 staterooms
- [ ] 2 marked as delivered with timestamp
- [ ] 3 remaining undelivered

### Gift Interactions
- [ ] Can add new recipients (stateroom numbers)
- [ ] Can mark recipient as delivered
- [ ] Can delete a recipient
- [ ] **Edge Case**: Cannot add own stateroom (9112 or 9114) as recipient

---

## 11. Pre-Cruise Checklist

- [ ] Shows 15 items organized by category
- [ ] Categories: Items to Purchase (4), Items to Pack (5), Pixie Dust Prep (3), Fish Extender (3)
- [ ] Some items pre-checked (Lanyards, Magnetic hooks, Pirate Night bandana, Autograph book)
- [ ] Checkboxes toggle correctly
- [ ] Can add custom items

---

## 12. Fleet Info / Ships (`/Secret-menU/ships`)

### Ship List
- [ ] All 8 ships displayed
- [ ] Each ship shows venues list

### Castaway Booking Calculator
- [ ] Date picker opens and selects a date
- [ ] Shows booking dates for all 6 Castaway levels
- [ ] User's level (Pearl = 25+ sailings) highlighted with "Your Level" badge
- [ ] Reverse lookup shows latest sailing bookable today for each level
- [ ] Early Booking grid shows days-early for new itineraries (0/1/2/3/4/4)
- [ ] First-timer row shows "Same day"

---

## 13. Stateroom Guide

- [ ] Browse staterooms by ship
- [ ] KristabelQ's reviews show on Wish 7122, Treasure 9510, Fantasy 7230
- [ ] Deck plan explorer works

---

## 14. Cruise Hacks (`/Secret-menU/hacks`)

- [ ] Shows 3 hack reviews (Magnetic hooks, Power strip, Skip MDR dessert)
- [ ] Verdict badges display (Must Try, Worth It)
- [ ] Ship name shows where applicable

---

## 15. Profile (`/profile`)

- [ ] Display name: KristabelQ
- [ ] Handle: @kristabelq
- [ ] Bio, home port, favorite ship display correctly
- [ ] Castaway membership: Platinum Castaway
- [ ] Sailing count shows 27
- [ ] Review count aggregates across all review types
- [ ] Can edit profile fields

---

## 16. Edge Cases

### B2B Sailings
- [ ] Treasure Jan 5-12 and Jan 12-19 both appear (not flagged as overlap)
- [ ] Each has separate reviews, planner items, etc.

### Auth Edge Cases
- [ ] Signing out clears all user-specific data from UI
- [ ] Signing back in restores all data
- [ ] No errors when viewing pages while signed out

### Review Uniqueness
- [ ] Cannot submit two reviews for same venue + sailing combo
- [ ] CAN submit review for same venue on different sailing

### Data Consistency
- [ ] Deleting a sailing removes all associated data (cascade)
- [ ] Profile review count updates when reviews are added/deleted

---

## 17. Quick Smoke Test Sequence

1. Open `/Secret-menU` → verify hub loads, upcoming sailing shows
2. Click "My Voyages" → 27 sailings visible
3. Click upcoming Wish sailing → detail page loads
4. Go back, click "Movie Checklist" → 18 watched shown in progress
5. Click "Character Checklist" → met characters highlighted
6. Click "Venue Guide" → search for "Palo" → see reviews
7. Go to Planner → see items for upcoming sailing
8. Check Pixie Dust → see gift recipients
9. Open Profile → verify stats
