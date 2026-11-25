import { LockKeyhole } from 'lucide-react';

export default function Dashboard({ user, onScan, scans }) {
  const total = scans.reduce((a, b) => a + (b.findings || 0), 0);
const hour = new Date().getHours();

const greeting =
  hour < 12
    ? 'Good morning'
    : hour < 17
    ? 'Good afternoon'
    : 'Good evening';
  return (
    <>
      <span className="eyebrow">Hybrid AI privacy</span>

      <h1>
        {greeting}, {user?.name?.split(' ')[0] || 'User'}
      </h1>

      <p className="muted">
        Protect sensitive information locally before anything reaches cloud AI.
      </p>

      <section className="card hero">
        <div className="drop">
          <LockKeyhole size={38} />

          <h2>Scan sensitive content safely</h2>

          <p className="muted">
            Paste text to detect personal and confidential information
            on-device.
          </p>

          <button className="primary" onClick={onScan}>
            Start Privacy Scan →
          </button>
        </div>

        <div className="aiStatus">
          <div className="pillCard">
            <span className="tag local">● LOCAL</span>
            <b>On-Device Privacy AI powered by Gemini Nano 4</b>
            <small>Semantic sanitization runs locally</small>
          </div>

          <div className="pillCard">
            <span className="tag cloud">☁ CLOUD</span>
            <b>Gemini Cloud AI</b>
            <small>Analyzes sanitized content only</small>
          </div>
        </div>
      </section>

      <div className="metrics">
        <div className="card metric">
          <span>Privacy scans</span>
          <b>{scans.length}</b>
        </div>

        <div className="card metric">
          <span>Sensitive items kept local</span>
          <b>{total}</b>
        </div>
      </div>
    </>
  );
}