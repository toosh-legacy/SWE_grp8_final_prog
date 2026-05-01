interface DashboardPlaceholderProps {
  title: string;
  description: string;
}

export default function DashboardPlaceholder({
  title,
  description,
}: DashboardPlaceholderProps) {
  return (
    <section className="dashboard-placeholder" aria-labelledby="placeholder-title">
      <h2 id="placeholder-title" className="dashboard-placeholder__title">
        {title}
      </h2>
      <p className="dashboard-placeholder__text">{description}</p>
    </section>
  );
}
