'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardUserId } from './DashboardLayout';
import {
  getMyGroups,
  createStudyGroup,
  joinStudyGroupByCode,
  groupAbbreviation,
} from '@/studyGroupService';
import type { StudyGroupRecord } from '@/studyGroupService';

// ─── Modals ───────────────────────────────────────────────────────────────────

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (g: StudyGroupRecord) => void;
}) {
  const userId = useDashboardUserId();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    setBusy(true);
    setError('');
    try {
      const group = await createStudyGroup(userId, title, description);
      onCreated(group);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create group.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sg-modal-overlay" role="dialog" aria-modal="true" aria-label="Create study group">
      <div className="sg-modal">
        <button type="button" className="sg-modal__close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="sg-modal__title">Create Study Group</h2>
        {error && <p className="error-banner" role="alert">{error}</p>}
        <form className="sg-modal__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sg-title">Group title</label>
            <input
              id="sg-title"
              type="text"
              maxLength={80}
              placeholder="e.g. Advanced Calculus Study"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="sg-desc">Description (optional)</label>
            <input
              id="sg-desc"
              type="text"
              maxLength={200}
              placeholder="What are you studying?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-confirm" disabled={busy || !title.trim()}>
            {busy ? 'Creating…' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
}

function JoinModal({
  onClose,
  onJoined,
}: {
  onClose: () => void;
  onJoined: (g: StudyGroupRecord) => void;
}) {
  const userId = useDashboardUserId();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { setError('Enter a join code.'); return; }
    setBusy(true);
    setError('');
    try {
      const group = await joinStudyGroupByCode(userId, code);
      onJoined(group);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join group.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sg-modal-overlay" role="dialog" aria-modal="true" aria-label="Join study group">
      <div className="sg-modal">
        <button type="button" className="sg-modal__close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="sg-modal__title">Join Study Group</h2>
        <p className="sg-modal__hint">Ask a group member for their 6-character code.</p>
        {error && <p className="error-banner" role="alert">{error}</p>}
        <form className="sg-modal__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sg-code">Join code</label>
            <input
              id="sg-code"
              type="text"
              maxLength={6}
              placeholder="e.g. AB3K7Q"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="sg-code-input"
              autoFocus
              required
            />
          </div>
          <button type="submit" className="btn btn-confirm" disabled={busy || code.trim().length < 6}>
            {busy ? 'Joining…' : 'Join Group'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Group code display ───────────────────────────────────────────────────────

function GroupCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <button
      type="button"
      className="sg-code-badge"
      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
      title="Click to copy join code"
    >
      {copied ? '✓ Copied' : code}
    </button>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

type Modal = 'create' | 'join' | null;

export default function StudyGroupsView() {
  const userId = useDashboardUserId();
  const router = useRouter();

  const [groups, setGroups] = useState<StudyGroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getMyGroups(userId)
      .then((data) => { if (!cancelled) setGroups(data); })
      .catch(() => { if (!cancelled) setError('Could not load your groups.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  function handleCreated(g: StudyGroupRecord) {
    setGroups((prev) => [g, ...prev]);
    setModal(null);
  }

  function handleJoined(g: StudyGroupRecord) {
    setGroups((prev) => {
      if (prev.some((x) => x.id === g.id)) return prev;
      return [g, ...prev];
    });
    setModal(null);
  }

  return (
    <>
      {modal === 'create' && (
        <CreateModal onClose={() => setModal(null)} onCreated={handleCreated} />
      )}
      {modal === 'join' && (
        <JoinModal onClose={() => setModal(null)} onJoined={handleJoined} />
      )}

      <div className="study-groups-panel">
        <header className="study-groups-toolbar">
          <button
            type="button"
            className="study-groups-action"
            onClick={() => setModal('join')}
          >
            Join Group
          </button>
          <button
            type="button"
            className="study-groups-action study-groups-action--primary"
            onClick={() => setModal('create')}
          >
            + Create Group
          </button>
        </header>

        {error && <div className="error-banner" role="alert">{error}</div>}

        {loading ? (
          <div className="feed-loading">Loading your groups…</div>
        ) : groups.length === 0 ? (
          <div className="feed-empty">
            <p className="feed-empty__title">No groups yet</p>
            <p className="feed-empty__detail">Create one or enter a join code to get started.</p>
          </div>
        ) : (
          <ul className="study-groups-list" role="list">
            {groups.map((g) => (
              <li
                key={g.id}
                className="study-group-card"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/study-group-messages/${g.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/study-group-messages/${g.id}`)}
                aria-label={`Open ${g.title}`}
              >
                <div className="study-group-card__avatar" aria-hidden>
                  {groupAbbreviation(g.title)}
                </div>

                <div className="study-group-card__body">
                  <span className="study-group-card__title">{g.title}</span>
                  <span className="study-group-card__meta">
                    {g.memberCount} member{g.memberCount === 1 ? '' : 's'}
                    {g.description ? ` · ${g.description}` : ''}
                  </span>
                </div>

                <GroupCodeBadge code={g.joinCode} />

                <span className="study-group-card__chevron" aria-hidden>›</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
