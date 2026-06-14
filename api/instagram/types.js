'use strict';

/**
 * @typedef {{ id: string|null, username: string|null, full_name: string|null,
 *   is_private: boolean, is_verified: boolean, profile_pic_url: string|null,
 *   follower_count: number|null, following_count: number|null,
 *   media_count: number|null, biography: string|null }} UserProfile
 *
 * @typedef {{ id: string|null, shortcode: string|null, taken_at: number|null,
 *   like_count: number|null, comment_count: number|null, play_count: number|null,
 *   caption: string|null, is_video: boolean, thumbnail_url: string|null,
 *   seen: number|null }} Post
 */

function parseUser(raw) {
  if (!raw) return null;
  return {
    id:             raw.id   ?? raw.pk   ?? null,
    username:       raw.username         ?? null,
    full_name:      raw.full_name        ?? null,
    is_private:     raw.is_private       ?? false,
    is_verified:    raw.is_verified      ?? false,
    profile_pic_url:raw.profile_pic_url  ?? null,
    follower_count: raw.follower_count   ?? null,
    following_count:raw.following_count  ?? null,
    media_count:    raw.media_count      ?? null,
    biography:      raw.biography        ?? null,
  };
}

function parsePost(raw) {
  if (!raw) return null;
  return {
    id:            raw.id          ?? raw.pk        ?? null,
    shortcode:     raw.code        ?? raw.shortcode ?? null,
    taken_at:      raw.taken_at                     ?? null,
    like_count:    raw.like_count                   ?? null,
    comment_count: raw.comment_count                ?? null,
    play_count:    raw.play_count                   ?? null,
    caption:       raw.caption?.text ?? raw.caption ?? null,
    is_video:      raw.is_video ?? (raw.media_type === 2) ?? false,
    thumbnail_url: raw.thumbnail_url ?? raw.display_url   ?? null,
    seen:          raw.seen ?? null, // commonly null for reels
  };
}

module.exports = { parseUser, parsePost };
