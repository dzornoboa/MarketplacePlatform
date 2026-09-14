/* Shown instantly on navigation while the server renders the page. */
export default function Loading() {
  return <div className="page-stack skeleton" aria-busy="true" aria-label="Loading">
    <div><p className="eyebrow">Console</p><div className="sk sk-title" /><div className="sk sk-line" /></div>
    <section className="dashboard-grid">
      <div className="sk sk-card" /><div className="sk sk-card" /><div className="sk sk-card" />
    </section>
    <div className="sk sk-block" />
  </div>
}
