'use client';

/**
 * CommentSection.tsx — Campus Connect
 * Thread under a post: load comments, add one (FR8d).
 *
 * Fetches by postId via postService; assumes parent already checked auth.
 */

import { useState, useEffect, type FormEvent } from 'react';
import type { Comment } from '@/index';
import { getCommentsByPost, addComment, MAX_COMMENT_LENGTH } from '@/postService';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getCommentsByPost(postId)
      .then((rows) => {
        if (!ignore) setComments(rows);
      })
      .catch((err) => console.error('comments load:', err))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [postId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || submitting) return;
    setSubmitting(true);
    try {
      const row = await addComment(postId, currentUserId, t);
      setComments((prev) => [...prev, row]);
      setText('');
    } catch (err) {
      console.error('add comment:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="post-card__comments" aria-label="Comments">
      {loading ? (
        <p className="post-card__comments-status">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="post-card__comments-status">No comments yet.</p>
      ) : (
        <ul className="post-card__comment-list" role="list">
          {comments.map((c) => (
            <li key={c.commentId} className="post-card__comment">
              <div
                className="post-card__comment-meta"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {c.authorPFP ? (
                  <img
                    src={c.authorPFP}
                    alt=""
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span
                    className="post-card__avatar"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: '#e2e8f0',
                    }}
                    aria-hidden
                  />
                )}
                <span className="post-card__comment-author" style={{ fontWeight: 600 }}>
                  {c.authorId === currentUserId ? 'You' : c.authorName}
                </span>
                <time className="post-card__comment-time" dateTime={c.createdAt}>
                  {new Date(c.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              <p className="post-card__comment-body">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      <form className="post-card__comment-form" onSubmit={onSubmit}>
        <label htmlFor={`comment-${postId}`} className="sr-only">
          Comment
        </label>
        <textarea
          id={`comment-${postId}`}
          className="post-card__comment-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          rows={2}
          maxLength={MAX_COMMENT_LENGTH}
          disabled={submitting}
        />
        <div className="post-card__comment-form-footer">
          <span className="post-card__comment-counter">
            {text.length}/{MAX_COMMENT_LENGTH}
          </span>
          <button
            type="submit"
            className="btn btn-primary btn-comment-submit"
            disabled={submitting || !text.trim()}
          >
            {submitting ? 'Posting…' : 'Comment'}
          </button>
        </div>
      </form>
    </section>
  );
}
