/**
 * StudyGroupsView — Campus Connect
 * Study Groups page layout (presentation only; actions can be wired later).
 */

export default function StudyGroupsView() {
  const groups = [
    { id: '1', title: 'Study Group 1' },
    { id: '2', title: 'Study Group 2' },
    { id: '3', title: 'Study Group 3' },
  ] as const;

  return (
    <div className="study-groups-panel">
      <header className="study-groups-toolbar">
        <button type="button" className="study-groups-action">
          Join Study Group
        </button>
        <button type="button" className="study-groups-action">
          Create Study Group
        </button>
      </header>

      <ul className="study-groups-list" role="list">
        {groups.map((g) => (
          <li key={g.id} className="study-group-card">
            <span className="study-group-card__avatar" aria-hidden />
            <div className="study-group-card__body">
              <span className="study-group-card__title">{g.title}</span>
              <span className="study-group-card__meta">User: msg…</span>
            </div>
            <span className="study-group-card__chevron" aria-hidden>
              &#8250;
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
