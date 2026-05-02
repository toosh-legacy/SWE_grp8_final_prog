'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { getCommentsByPost, addComment, MAX_COMMENT_LENGTH } from '@/postService';
import type { Comment } from '@/index';

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
}

export default function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments when the section is opened
  useEffect(() => {
    getCommentsByPost(postId)
      .then(setComments)
      .catch((err) => console.error("Failed to load comments", err))
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleCommentSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || submitting) return;
    
    setSubmitting(true);
    try {
      const created = await addComment(postId, currentUserId, trimmed);
      setComments((prev) => [...prev, created]);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="post-card__comments" aria-label="Comments">
      {loading ? (
        <p className="post-card__comments-status">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="post-card__comments-status">No comments yet. Be the first to reply.</p>
      ) : (
        <ul className="post-card__comment-list" role="list">
          {comments.map((c) => (
            <li key={c.commentId} className="post-card__comment">
              
              {/* Updated Meta Row: Now includes PFP and actual Username */}
              <div className="post-card__comment-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {c.authorPFP ? (
                  <img 
                    src={c.authorPFP} 
                    alt="" 
                    style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  <span className="post-card__avatar" style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#e2e8f0' }} aria-hidden />
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

      {/* Your exact form markup, now wired to the component's state */}
      <form className="post-card__comment-form" onSubmit={handleCommentSubmit}>
        <label htmlFor={`comment-${postId}`} className="sr-only">
          Write a comment
        </label>
        <textarea
          id={`comment-${postId}`}
          className="post-card__comment-input"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a comment…"
          rows={2}
          maxLength={MAX_COMMENT_LENGTH || 250}
          disabled={submitting}
        />
        <div className="post-card__comment-form-footer">
          <span className="post-card__comment-counter">
            {commentText.length}/{MAX_COMMENT_LENGTH || 250}
          </span>
          <button
            type="submit"
            className="btn btn-primary btn-comment-submit"
            disabled={submitting || !commentText.trim()}
          >
            {submitting ? 'Posting…' : 'Comment'}
          </button>
        </div>
      </form>
    </section>
  );
}
