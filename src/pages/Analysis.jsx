import { useState } from 'react';
import {
  ShieldCheck,
  LockKeyhole,
  Cloud,
  ArrowRight,
  Check
} from 'lucide-react';

import { analyzeSanitized } from '../services/aiService';

export default function Analysis({
  scanResult,
  onAnalyzed,
  addTrace
}) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function run(type) {
    try {
      setBusy(type);
      setError('');
      setResult(null);

      const sanitizedText =
        scanResult?.sanitizedText || '';

      if (!sanitizedText.trim()) {
        throw new Error(
          'No privacy-safe content is available for cloud analysis.'
        );
      }

      console.log(
        'Sending privacy-safe text to cloud analysis:',
        type
      );

      const r = await analyzeSanitized(
        sanitizedText,
        type
      );

      setResult(r);

      addTrace(
        [
          {
            name:
              type === 'summary'
                ? 'Document summary'
                : type === 'actions'
                ? 'Action extraction'
                : 'Risk analysis',

            ...r.execution,

            note:
              'Sanitized content only'
          }
        ],
        true
      );

      onAnalyzed(type, r);

    } catch (err) {

      console.error(
        'Cloud analysis failed:',
        err
      );

      setError(
        err?.message ||
          'Cloud analysis failed.'
      );

    } finally {

      setBusy('');
    }
  }

  return (
    <>
      <span className="eyebrow">
        Cloud intelligence
      </span>

      <h1>
        Analyze the sanitized content
      </h1>

      <p className="muted lead">
        PrivateLens has completed local privacy
        protection. Only the sanitized version is
        eligible for Gemini Cloud AI.
      </p>


      {/* =====================================================
          PRIVACY HANDOFF
          ===================================================== */}

      <section className="analysisHandoff">

        <div className="analysisStage">

          <div className="analysisStageIcon localStage">
            <ShieldCheck size={22} />
          </div>

          <div>
            <span className="tag local">
              <Check size={12} />
              ON DEVICE
            </span>

            <h3>
              Privacy protected
            </h3>

            <p className="tiny">
              Deterministic guardrails +
              semantic privacy AI
            </p>
          </div>

        </div>


        <div className="analysisConnector">
          <ArrowRight size={20} />
        </div>


        <div className="analysisStage">

          <div className="analysisStageIcon boundaryStage">
            <LockKeyhole size={22} />
          </div>

          <div>
            <span className="analysisBoundaryLabel">
              PRIVACY BOUNDARY
            </span>

            <h3>
              Sanitized content only
            </h3>

            <p className="tiny">
              Raw sensitive content remains
              on-device
            </p>
          </div>

        </div>


        <div className="analysisConnector">
          <ArrowRight size={20} />
        </div>


        <div className="analysisStage">

          <div className="analysisStageIcon cloudStage">
            <Cloud size={22} />
          </div>

          <div>
            <span className="tag cloud">
              ☁ CLOUD
            </span>

            <h3>
              Gemini Cloud AI
            </h3>

            <p className="tiny">
              Business intelligence on
              privacy-safe content
            </p>
          </div>

        </div>

      </section>


      <div className="notice">
        ✓ Privacy boundary passed — raw sensitive
        content was not transmitted to cloud AI.
      </div>


      {/* =====================================================
          CLOUD ANALYSIS
          ===================================================== */}

      <section className="card result">

        <div className="cloudAnalysisHeader">

          <div>

            <span className="tag cloud">
              ☁ CLOUD
            </span>

            <h2>
              What would you like to do?
            </h2>

            <p className="muted">
              Gemini receives only the sanitized
              content produced by the local privacy
              pipeline.
            </p>

          </div>

        </div>


        <div className="actions">

          {[
            ['summary', 'Summarize'],
            ['actions', 'Extract Actions'],
            ['risks', 'Identify Risks']
          ].map(([key, label]) => (

            <button
              className="secondary"
              disabled={!!busy}
              onClick={() => run(key)}
              key={key}
            >
              {busy === key
                ? 'Analyzing…'
                : label}
            </button>

          ))}

        </div>


        {busy && (
          <div className="cloudWorking resultSpace">

            <Cloud size={18} />

            <div>
              <strong>
                Gemini Cloud AI is analyzing
                sanitized content
              </strong>

              <p className="tiny">
                No original sensitive content is
                included in this request.
              </p>
            </div>

          </div>
        )}


        {error && (
          <div className="risk resultSpace">
            ⚠ {error}
          </div>
        )}


        {!result && !busy && !error && (
          <p className="muted resultSpace">
            Choose an analysis action to send the
            privacy-safe version to Gemini Cloud AI.
          </p>
        )}


        {result && !busy && (
          <div className="resultSpace cloudResult">

            <div className="cloudResultHeader">

              <div>
                <span className="tag cloud">
                  ☁ CLOUD RESULT
                </span>

                <h3>
                  {result.title}
                </h3>
              </div>

              <span className="cloudSafeBadge">
                <ShieldCheck size={14} />
                Sanitized input
              </span>

            </div>


            {result.body && (
              <p>
                {result.body}
              </p>
            )}


            {result.items && (
              <ul>
                {result.items.map(
                  (item, index) => (
                    <li key={`${item}-${index}`}>
                      {item}
                    </li>
                  )
                )}
              </ul>
            )}


            {result.risk && (
              <div className="risk">
                ⚠ {result.risk}
              </div>
            )}


            <div className="cloudResultMeta">

              <Cloud size={14} />

              <span>
                Gemini cloud analysis
              </span>

              <span>•</span>

              <span>
                Privacy-safe text only
              </span>

              {result.execution?.latencyMs && (
                <>
                  <span>•</span>

                  <span>
                    {result.execution.latencyMs} ms
                  </span>
                </>
              )}

            </div>

          </div>
        )}

      </section>
    </>
  );
}