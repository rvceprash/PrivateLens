function when(ts) {
  const m = Math.max(
    0,
    Math.round((Date.now() - ts) / 60000)
  );

  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;

  return new Date(ts).toLocaleString();
}


export default function History({ scans }) {

  return (
    <>
      <span className="eyebrow">
        Privacy activity
      </span>

      <h1>Privacy scan history</h1>

      <p className="muted">
        Only privacy-safe metadata is stored.
        Original sensitive content is never persisted.
      </p>


      <section className="card history">

        <div className="historyRow head">
          <span>Scan</span>
          <span>Protection</span>
          <span>Route</span>
          <span>Status</span>
          <span>When</span>
        </div>


        {scans.length === 0 ? (

          <div className="historyEmpty">
            <b>No privacy scans yet</b>

            <span className="muted">
              Completed scans will appear here.
            </span>
          </div>

        ) : (

          scans.map((s) => {

            const wentToCloud =
              s.route?.includes('CLOUD');

            return (
              <div
                className="historyRow"
                key={s.id}
              >

                <b>
                  {s.name || 'Pasted content'}
                </b>


                <span>
                  <strong>
                    {s.findings || 0}
                  </strong>{' '}
                  structured findings
                  <small
                    style={{
                      display: 'block',
                      marginTop: '3px'
                    }}
                    className="muted"
                  >
                    + semantic privacy scan
                  </small>
                </span>


                <span>
                  <i
                    className={`tag ${
                      wentToCloud
                        ? 'cloud'
                        : 'local'
                    }`}
                  >
                    {wentToCloud
                      ? 'LOCAL → CLOUD'
                      : 'LOCAL ONLY'}
                  </i>
                </span>


                <span>
                  <i className="tag local">
                    ✓ PROTECTED
                  </i>
                </span>


                <small>
                  {when(s.createdAt)}
                </small>

              </div>
            );
          })

        )}

      </section>
    </>
  );
}