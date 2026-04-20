/**
 * CreatePostForm.tsx — Campus Connect
 * Create Post / Event Form Component
 *
 * Covers FR8 (publish content), FR8a (section selection), FR18 (events).
 * Calls postService.createPost and eventService.publishEvent.
 */

import { useState } from 'react';
import type { Post, FeedCategory } from '../types';
import { createPost, MAX_POST_LENGTH } from '../services/postService';
import { publishEvent } from '../services/eventService';
import type { CampusEvent } from '../types';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CreatePostFormProps {
  authorId: string;
  defaultType?: FeedCategory;
  onPostCreated:  (post: Post) => void;
  onEventCreated?: (event: CampusEvent) => void;
  onCancel:       () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CreatePostForm({
  authorId,
  defaultType = 'general',
  onPostCreated,
  onEventCreated,
  onCancel,
}: CreatePostFormProps) {
  // Shared state
  const [type,     setType]     = useState<FeedCategory>(defaultType);
  const [content,  setContent]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Event-specific state (only used when type === 'event')
  const [eventTitle,    setEventTitle]    = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate,     setEventDate]     = useState('');
  const [eventCapacity, setEventCapacity] = useState<number | ''>('');

  const isEventMode  = type === 'event';
  const charCount    = content.length;
  const charRemaining = MAX_POST_LENGTH - charCount;
  const isOverLimit   = charCount > MAX_POST_LENGTH;

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): string {
    if (!content.trim()) return 'Post content is required.';
    if (isOverLimit)      return `Post must be ${MAX_POST_LENGTH} characters or fewer.`;

    if (isEventMode) {
      if (!eventTitle.trim())    return 'Event title is required.';
      if (!eventLocation.trim()) return 'Event location is required.';
      if (!eventDate)            return 'Event date/time is required.';
      if (!eventCapacity || Number(eventCapacity) <= 0)
        return 'Event capacity must be a positive number.';
    }

    return '';
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validationMsg = validate();
    if (validationMsg) { setError(validationMsg); return; }

    setLoading(true);
    try {
      if (isEventMode) {
        // Create both the post (for the feed) and the event record
        const [post, event] = await Promise.all([
          createPost(authorId, content, 'event'),
          publishEvent(
            authorId,
            eventTitle,
            eventLocation,
            new Date(eventDate).toISOString(),
            Number(eventCapacity)
          ),
        ]);
        onPostCreated(post);
        onEventCreated?.(event);
      } else {
        const post = await createPost(authorId, content, type);
        onPostCreated(post);
      }
    } catch (err: any) {
      // Strip the error prefix codes for a cleaner user-facing message
      const msg = err.message ?? 'Something went wrong. Please try again.';
      setError(msg.replace(/^[A-Z_]+:\s*/, ''));
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="create-post-form">
      <h2 className="create-post-form__title">Create a Post</h2>

      {/* Error banner */}
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>

        {/* Post Type Selector */}
        <div className="form-group">
          <label htmlFor="post-type">Section</label>
          <select
            id="post-type"
            value={type}
            onChange={(e) => setType(e.target.value as FeedCategory)}
            disabled={loading}
          >
            <option value="general">General</option>
            <option value="announcement">Announcement</option>
            <option value="event">Event</option>
          </select>
        </div>

        {/* Post Content */}
        <div className="form-group">
          <label htmlFor="post-content">
            {isEventMode ? 'Event Description' : 'Post Content'}
          </label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isEventMode
                ? 'Describe your event…'
                : 'Share something with your campus…'
            }
            rows={4}
            disabled={loading}
            aria-invalid={isOverLimit}
            aria-describedby="char-counter"
          />
          <span
            id="char-counter"
            className={`char-counter ${isOverLimit ? 'char-counter--over' : ''}`}
            aria-live="polite"
          >
            {charRemaining} characters remaining
          </span>
        </div>

        {/* Event-specific fields */}
        {isEventMode && (
          <div className="event-fields">

            <div className="form-group">
              <label htmlFor="event-title">Event Title</label>
              <input
                id="event-title"
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. CS 3354 Study Session"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-location">Location</label>
              <input
                id="event-location"
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g. JSOM 2.803"
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event-date">Date &amp; Time</label>
                <input
                  id="event-date"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-capacity">Max Attendees</label>
                <input
                  id="event-capacity"
                  type="number"
                  value={eventCapacity}
                  onChange={(e) =>
                    setEventCapacity(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  min={1}
                  placeholder="50"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || isOverLimit}
          >
            {loading
              ? 'Posting…'
              : isEventMode
              ? 'Publish Event'
              : 'Post'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
