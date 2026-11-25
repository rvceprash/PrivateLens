import { X, ShieldCheck, LockKeyhole, Cloud, Cpu } from 'lucide-react';

export default function TraceDrawer({
  open,
  onClose,
  trace
}) {
  if (!open) return null;

  const hasTrace = trace.length > 0;

  const hasCloudStep = trace.some(
    (t) =>
      String(t.location || '').toUpperCase() === 'CLOUD' ||
      String(t.location || '').toLowerCase() === 'in_cloud'
  );

  return (
    <aside className="trace">

      {/* HEADER */}
      <div className="traceHead">
        <div>
          <span className="eyebrow">
            Transparency
          </span>

          <h3>AI Execution Trace</h3>

          <small>
            See exactly where each AI operation executes.
          </small>
        </div>

        <button
          className="iconBtn"
          onClick={onClose}
          aria-label="Close execution trace"
        >
          <X size={18} />
        </button>
      </div>


      {/* EMPTY STATE */}
      {!hasTrace && (
        <div className="traceEmpty">

          <div className="traceEmptyIcon">
            <ShieldCheck size={26} />
          </div>

          <b>No AI operations yet</b>

          <p className="muted">
            Run a privacy scan to see the local privacy
            pipeline and cloud execution path.
          </p>

        </div>
      )}


      {/* REAL EXECUTION TRACE */}
      {hasTrace && (
        <>

          <div className="traceSectionLabel">
            <Cpu size={14} />
            ON-DEVICE PROCESSING
          </div>


          {trace
            .filter(
              (t) =>
                String(t.location || '').toUpperCase() !== 'CLOUD' &&
                String(t.location || '').toLowerCase() !== 'in_cloud'
            )
            .map((t, i) => (

              <div
                className="traceItem"
                key={`local-${i}`}
              >

                <div className="traceStep">

                  <div className="traceDot localDot">
                    ✓
                  </div>

                  <div className="traceStepContent">

                    <span className="tag local">
                      ● ON DEVICE
                    </span>

                    <h4>
                      {i + 1}. {t.name}
                    </h4>

                    <small>
                      {t.model}
                      {typeof t.latencyMs === 'number'
                        ? ` · ${t.latencyMs} ms`
                        : ''}
                    </small>

                    {t.note && (
                      <small className="traceNote">
                        {t.note}
                      </small>
                    )}

                  </div>

                </div>

              </div>
            ))}


          {/* PRIVACY BOUNDARY */}
          <div className="privacyBoundary">

            <div className="privacyBoundaryTitle">
              <LockKeyhole size={15} />
              PRIVACY BOUNDARY
            </div>

            <small>
              Raw sensitive content cannot cross this boundary.
            </small>

            <b>
              Sanitized content only →
            </b>

          </div>


          {/* CLOUD SECTION */}
          <div className="traceSectionLabel cloudSection">
            <Cloud size={14} />
            CLOUD PROCESSING
          </div>


          {hasCloudStep ? (

            trace
              .filter(
                (t) =>
                  String(t.location || '').toUpperCase() === 'CLOUD' ||
                  String(t.location || '').toLowerCase() === 'in_cloud'
              )
              .map((t, i) => (

                <div
                  className="traceItem"
                  key={`cloud-${i}`}
                >

                  <div className="traceStep">

                    <div className="traceDot cloudDot">
                      ✓
                    </div>

                    <div className="traceStepContent">

                      <span className="tag cloud">
                        ☁ CLOUD
                      </span>

                      <h4>
                        {t.name}
                      </h4>

                      <small>
                        {t.model}
                        {typeof t.latencyMs === 'number'
                          ? ` · ${t.latencyMs} ms`
                          : ''}
                      </small>

                      {t.note && (
                        <small className="traceNote">
                          {t.note}
                        </small>
                      )}

                      <small className="traceCloudSafety">
                        ✓ Sanitized content only
                      </small>

                    </div>

                  </div>

                </div>
              ))

          ) : (

            <div className="cloudNotInvoked">

              <span className="tag cloud">
                ○ CLOUD NOT INVOKED
              </span>

              <b>
                Sanitized content has not been sent to cloud AI.
              </b>

              <small>
                Cloud analysis starts only after the user chooses
                to analyze the privacy-safe version.
              </small>

            </div>

          )}

        </>
      )}

    </aside>
  );
}