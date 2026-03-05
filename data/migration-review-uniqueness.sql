-- Enforce one review per user per venue/restaurant/activity per sailing
-- Users can review the same venue on different sailings (e.g. sailed twice on same ship)

-- Venue reviews: one per user + venue + sailing
ALTER TABLE venue_reviews
  ADD CONSTRAINT venue_reviews_user_venue_sailing_unique
  UNIQUE (user_id, venue_id, sailing_id);

-- Dining reviews: one per user + restaurant + sailing
ALTER TABLE dining_reviews
  ADD CONSTRAINT dining_reviews_user_restaurant_sailing_unique
  UNIQUE (user_id, restaurant_id, sailing_id);

-- Activity reviews: one per user + activity + sailing
ALTER TABLE activity_reviews
  ADD CONSTRAINT activity_reviews_user_activity_sailing_unique
  UNIQUE (user_id, activity_id, sailing_id);
