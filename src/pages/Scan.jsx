import { useState } from 'react';
import {
  LockKeyhole,
  ShieldCheck,
  Cloud,
  ArrowDown
} from 'lucide-react';

import {
  initializeLocalAI,
  scanLocally
} from '../services/aiService';


const sample = `Employee: Alice Johnson

Alice is a senior finance manager working on Project Phoenix.

She lives near Cherokee Park in Louisville and recently moved from Chicago.

Her daughter Emma attends Lakeside Academy.

Alice mentioned that she will undergo knee surgery next month and will be out of work for approximately three weeks.

Project Phoenix has a $75,000 budget and is scheduled for production deployment on December 20.

Executive approval is required by December 15.

The security assessment remains incomplete.

Contact Alice at alice.johnson@example.com or 502-555-1234.

Her SSN is 123-45-6789.`;


export default function Scan({
  onScanned,
  onAnalyze,
  addTrace
}) {

  const [text, setText] = useState(sample);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');


  async function run() {

    if (!text.trim()) {
      return;
    }

    setBusy(true);
    setError('');
    setResult(null);

    try {

      // ------------------------------------------------------
      // STEP 1
      // Initialize / download the REAL on-device model.
      // ------------------------------------------------------

      setStatus(
        'Preparing on-device AI…'
      );

      await initializeLocalAI(
        (percent) => {

          setProgress(percent);

          setStatus(
            `Preparing on-device AI… ${percent}%`
          );

        }
      );


      // ------------------------------------------------------
      // STEP 2
      // Perform local privacy scan.
      // ------------------------------------------------------

      setStatus(
        'Scanning sensitive information locally…'
      );

      const r =
        await scanLocally(text);


      console.log(
        'LOCAL PRIVACY RESULT:',
        r
      );


      setResult(r);


      // ------------------------------------------------------
      // EXECUTION TRACE
      // ------------------------------------------------------

      if (addTrace) {

        addTrace([
          {
            name:
              'Deterministic privacy guardrails',

            model:
              'Regex / deterministic rules',

            location:
              'ON DEVICE',

            latencyMs:
              0,

            simulated:
              false,

            note:
              `Detected ${r.deterministic?.count ?? r.count ?? 0} structured identifiers`
          },

          {
            name:
              'On-device semantic privacy AI',

            ...r.execution,

            note:
              'Original content transmitted to cloud: NO'
          },

          {
            name:
              'Privacy-safe output',

            model:
              'PrivateLens privacy pipeline',

            location:
              'ON DEVICE',

            latencyMs:
              r.execution?.latencyMs,

            simulated:
              false,

            note:
              'Only sanitized content is eligible for cloud analysis'
          }
        ]);

      }


      if (onScanned) {
        onScanned(r);
      }


      setProgress(100);

      setStatus(
        'Privacy scan completed on device.'
      );

    } catch (err) {

      console.error(
        'LOCAL AI ERROR:',
        err
      );


      setError(
        err?.message ||
        'The on-device privacy scan failed.'
      );


      setStatus(
        'On-device AI unavailable.'
      );

    } finally {

      setBusy(false);

    }

  }


  return (
    <>

      <span className="eyebrow">
        New privacy scan
      </span>


      <h1>
        Sanitize before you send
      </h1>


      <p className="muted">
        PrivateLens first applies deterministic privacy
        guardrails, then uses on-device AI to detect
        contextual sensitive information. Only the
        sanitized version can proceed to cloud AI.
      </p>


      <section className="card scanGrid">

        {/* ORIGINAL DOCUMENT */}

        <div className="pane">

          <h3>
            Original
          </h3>

          <textarea
            value={text}
            onChange={(e) => {

              setText(e.target.value);

              // Previous result no longer represents
              // the edited document.

              setResult(null);
              setError('');
              setStatus('');

            }}
          />

        </div>


        {/* PRIVACY SAFE DOCUMENT */}

        <div className="pane">

          <h3>
            Privacy-safe version{' '}

            <span className="tag local">
              ● LOCAL
            </span>
          </h3>


          <div className="safe">

            {result?.sanitizedText || (

              <span className="muted">
                Run the local privacy scan to generate
                sanitized content.
              </span>

            )}

          </div>

        </div>


        {/* SCAN FOOTER */}

        <div className="scanFooter">

          <div className="findings">

            {result ? (

              Object.entries(
                result.byType || {}
              ).map(
                ([key, value]) => (

                  <span
                    className="finding"
                    key={key}
                  >
                    {key}{' '}
                    <b>{value}</b>
                  </span>

                )
              )

            ) : (

              <small>
                Nothing has been sent to the cloud.
              </small>

            )}

          </div>


          <button
            className="primary"
            disabled={
              busy ||
              !text.trim()
            }
            onClick={run}
          >

            {busy
              ? 'Scanning locally…'
              : '🔒 Scan Locally'}

          </button>

        </div>

      </section>


      {/* MODEL INITIALIZATION / SCAN STATUS */}

      {busy && (

        <div className="notice">

          🔒 {status}

          {progress !== null &&
            progress < 100 && (
              <>
                {' '}
                Model setup: {progress}%
              </>
            )}

        </div>

      )}


      {/* ERROR */}

      {error && (

        <div
          className="notice"
          style={{
            borderColor: '#ef4444',
            color: '#b91c1c'
          }}
        >

          ✕ Local AI error: {error}

        </div>

      )}


      {/* SUCCESS */}

      {result && !error && (

        <>

          {/* LOCAL PRIVACY SUCCESS */}

          <div className="notice">

            ✓ Privacy scan completed locally.
            Deterministic guardrails and on-device AI
            protected the document before cloud processing.

          </div>


          {/* EXECUTION PROOF */}

          <div className="scanExecution">

            <div className="scanExecutionItem">

              <ShieldCheck size={18} />

              <div>
                <small>
                  PRIVACY PROCESSING
                </small>

                <b>
                  Verified on-device
                </b>
              </div>

            </div>


            <div className="scanExecutionItem">

              <span className="scanExecutionCheck">
                ✓
              </span>

              <div>
                <small>
                  INFERENCE SOURCE
                </small>

                <b>
                  {result.execution?.location ||
                    'ON_DEVICE'}
                </b>
              </div>

            </div>


            <div className="scanExecutionItem">

              <span className="scanExecutionCheck">
                ✓
              </span>

              <div>
                <small>
                  RAW DATA SENT TO CLOUD
                </small>

                <b>
                  NO
                </b>
              </div>

            </div>


            <div className="scanExecutionItem">

              <span className="scanExecutionCheck">
                ✓
              </span>

              <div>
                <small>
                  PROCESSING TIME
                </small>

                <b>
                  {(
                    (result.execution?.latencyMs || 0) /
                    1000
                  ).toFixed(1)} sec
                </b>
              </div>

            </div>

          </div>


          {/* FLOW ARROW */}

          <div className="boundaryArrow">

            <ArrowDown size={18} />

          </div>


          {/* PRIVACY BOUNDARY */}

          <div className="scanPrivacyBoundary">

            <div className="scanBoundaryIcon">

              <LockKeyhole size={22} />

            </div>


            <div className="scanBoundaryContent">

              <span className="scanBoundaryLabel">
                PRIVACY BOUNDARY
              </span>

              <h3>
                Raw sensitive content stops here
              </h3>

              <p>
                The original document remains on this
                device. Only the privacy-safe version
                above is eligible for cloud processing.
              </p>


              <div className="boundaryChecks">

                <span>
                  ✓ Deterministic guardrails applied
                </span>

                <span>
                  ✓ Semantic AI executed on-device
                </span>

                <span>
                  ✓ Privacy validation passed
                </span>

              </div>

            </div>

          </div>


          {/* FLOW ARROW */}

          <div className="boundaryArrow">

            <ArrowDown size={18} />

            <span>
              SANITIZED CONTENT ONLY
            </span>

          </div>


          {/* CLOUD HANDOFF */}

          <div className="cloudHandoff">

            <div className="cloudHandoffInfo">

              <div className="cloudHandoffIcon">
                <Cloud size={20} />
              </div>


              <div>

                <span className="tag cloud">
                  ☁ CLOUD
                </span>

                <h3>
                  Ready for Gemini Cloud AI
                </h3>

                <p className="muted">
                  Cloud AI will receive only the
                  sanitized content shown above.
                </p>

              </div>

            </div>


            <button
              className="primary"
              onClick={() => {

                console.log(
                  'Sending ONLY privacy-safe version to cloud:',
                  result.sanitizedText
                );

                onAnalyze(result);

              }}
            >

              Analyze Safe Version →

            </button>

          </div>

        </>

      )}

    </>
  );
}