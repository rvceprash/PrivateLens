// src/services/aiService.js
//
// PrivateLens Hybrid AI Architecture
//
// Layer 1: Deterministic privacy guardrails
//          SSN, email, phone, explicitly-labeled employee names
//
// Layer 2: Firebase AI Logic - ONLY_ON_DEVICE
//          Detects contextual / semantic sensitive information
//
// Layer 3: Firebase AI Logic - ONLY_IN_CLOUD
//          Receives ONLY sanitized text for:
//          - summarization
//          - action extraction
//          - risk analysis

import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
} from 'firebase/ai';

import {
  firebaseApp,
  firebaseConfigured
} from './firebase';


// ============================================================
// LAYER 1
// DETERMINISTIC PRIVACY GUARDRAILS
// ============================================================
//
// These rules intentionally remain.
//
// They provide fast, predictable protection for structured PII.
// The on-device AI complements these rules by detecting contextual
// information that regex cannot reliably understand.
//

const rules = [
  {
    label: 'SSN',
    re: /\b\d{3}-\d{2}-\d{4}\b/g,
    replace: '[SSN REDACTED]'
  },
  {
    label: 'Email',
    re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replace: '[EMAIL REDACTED]'
  },
  {
    label: 'Phone',
    re: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    replace: '[PHONE REDACTED]'
  },
  {
  label: 'Employee ID',
  re: /\bEMP[-\s]?\d{4,12}\b/gi,
  replace: '[EMPLOYEE IDENTIFIER]'
},
{
  label: 'Routing Number',
  re: /\b(?:routing\s+(?:number|#)?\s*:?\s*)\d{9}\b/gi,
  replace: 'routing number [FINANCIAL IDENTIFIER]'
},
{
  label: 'Account Number',
  re: /\b(?:account\s+(?:number|#)?\s*:?\s*)\d{4,17}\b/gi,
  replace: 'account [FINANCIAL IDENTIFIER]'
},
{
  label: 'Account Last Four',
  re: /\b(?:account\s+ending\s+(?:in\s+)?)\d{4}\b/gi,
  replace: 'account ending in [FINANCIAL IDENTIFIER]'
},
  {
    label: 'Person',
    re: /Employee:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
    replace: 'Employee: [PERSON]'
  }
];


// ============================================================
// FIREBASE AI INSTANCE
// ============================================================

const ai = firebaseConfigured
  ? getAI(firebaseApp, {
      backend: new GoogleAIBackend()
    })
  : null;


// ============================================================
// LAYER 2
// REAL ON-DEVICE MODEL
// ============================================================
//
// CRITICAL PRIVACY DESIGN:
//
// We deliberately use ONLY_ON_DEVICE.
//
// DO NOT change this to PREFER_ON_DEVICE for the privacy scan.
//
// PREFER_ON_DEVICE could fall back to cloud if local inference
// isn't available. Raw sensitive information must never silently
// fall back to cloud.
//

const localModel = ai
  ? getGenerativeModel(ai, {
      mode: InferenceMode.ONLY_ON_DEVICE,

      onDeviceParams: {
        createOptions: {
          expectedInputs: [
            {
              type: 'text',
              languages: ['en']
            }
          ],

          expectedOutputs: [
            {
              type: 'text',
              languages: ['en']
            }
          ],

          initialPrompts: [
            {
              role: 'system',

              content: [
                {
                  type: 'text',

                  value: `
You are the on-device privacy sanitization engine for PrivateLens.

Your task is DATA MINIMIZATION.

Sanitize sensitive or personally identifying information BEFORE

the document is permitted to leave the user's device.

The document may already contain privacy markers inserted by

deterministic local rules.

NEVER reconstruct, infer, modify, or remove existing privacy markers.

IDENTITY:

Replace names of people with:

[PERSON]

This includes:

- full names

- first names

- last names

- family member names

- names repeated elsewhere in the document

- names associated with employment, health, education, or location

If a person has already been represented as [PERSON], redact other

named references that appear to refer to that person.
PROJECT AND BUSINESS ENTITY PROTECTION:

Names associated with projects, programs, initiatives, products,
platforms, applications, systems, teams, departments, companies,
and organizations are BUSINESS INFORMATION, not person names.

Preserve them unless the name itself contains personal information.

Examples:

Project Nova
Project Horizon
Project Atlas
Program Apollo
Enterprise Plus
Enterprise Technology
Payments Operations

must remain unchanged.

Never convert:

"Project Nova"

into:

"Project [PERSON]"

If a person's name and project name occur in the same sentence:

"Jonathan Miller leads Project Nova."

must become:

"[PERSON] leads Project Nova."

LOCATION:

Replace personally associated geographic information with:

[LOCATION]

Examples include:

- neighborhoods

- cities

- previous residences

- locations associated with where someone lives

HEALTH:

Remove medical information that is not necessary for the business purpose.

Replace diagnoses, procedures, treatments, surgeries, symptoms,

medical appointments, and medical reasons with:

[MEDICAL INFORMATION]

Preserve business-relevant operational information when possible.

Example:

"Jane will undergo knee surgery and will be out for three weeks."

should become:

"[PERSON] will be out of work for approximately three weeks."

The absence duration remains useful business information.

The medical reason does not.
MEDICAL MINIMIZATION:

Medical privacy includes:

- diagnoses
- diseases
- conditions
- medications
- procedures
- treatments
- specialist names
- medical facilities when associated with treatment
- medical appointments
- medical reasons for absence

Do not leave a diagnosis visible simply because another part of
the sentence was sanitized.

For example:

"His wife Rebecca is undergoing treatment for multiple sclerosis
at UCHealth and he may need five business days away from work."

should become:

"His wife [PERSON] has [MEDICAL INFORMATION], and he may need
five business days away from work."

When possible, prefer removing unnecessary medical context entirely
while preserving the business impact:

"[PERSON] may need five business days away from work."

Never preserve:

"multiple sclerosis"

"breast cancer"

"diabetes"

"cardiology appointment"

"knee surgery"

when those terms describe an identifiable person's health.
EDUCATION:

Replace personally associated schools or educational institutions with:

[SCHOOL]

OTHER SENSITIVE INFORMATION:

Use appropriate markers:

[ADDRESS]

[ACCOUNT IDENTIFIER]

[EMPLOYEE IDENTIFIER]

[SENSITIVE INFORMATION]

BUSINESS INFORMATION:

DO NOT redact information solely because it is a date, number,

budget, deadline, project detail, company name, or organization name.

Preserve:

- project names

- company names

- organization names

- employer names

- department names

- team names

- project budgets

- project deadlines

- deployment dates

- approval deadlines

- project risks

- security findings

- project status

- operational requirements

IMPORTANT ORGANIZATION RULE:

A company, employer, bank, department, team, or organization name

is NOT an employee identifier.

Do NOT replace organization names with:

[EMPLOYEE IDENTIFIER]

For example:

"Her husband Daniel works at Riverstone Bank."

should become:

"Her husband [PERSON] works at Riverstone Bank."

NOT:

"Her husband [PERSON] works at [EMPLOYEE IDENTIFIER]."

Similarly:

"Sarah works for Acme Corporation."

should become:

"[PERSON] works for Acme Corporation."

Preserve the organization name unless the organization itself reveals

sensitive personal information.

An EMPLOYEE IDENTIFIER means an actual identifier assigned to a person,

such as:

- EMP-847291

- employee number 39281

- worker ID W-19283

- personnel ID 83721

Those should become:

[EMPLOYEE IDENTIFIER]

Examples of business information that must remain:

"Project Phoenix has a $75,000 budget."

must remain unchanged.

"Production deployment is December 20."

must remain unchanged.

"Executive approval is required by December 15."

must remain unchanged.

OUTPUT RULES:

1. Return the COMPLETE sanitized document.

2. Do not summarize.

3. Do not explain your reasoning.

4. Do not add commentary.

5. Preserve useful business context.

6. Remove unnecessary personal context.

7. Preserve existing privacy markers exactly.

8. Return ONLY the sanitized document.
`
                }
              ]
            }
          ]
        }
      }
    })
  : null;


// ============================================================
// LOCAL MODEL INITIALIZATION
// ============================================================

let deviceModelInitialized = false;


/**
 * Initializes / downloads the browser's on-device model.
 *
 * IMPORTANT:
 * Call this from a user interaction such as the
 * "Scan Locally" button.
 */
export async function initializeLocalAI(onProgress) {

  if (!firebaseConfigured || !localModel) {
    throw new Error(
      'Firebase AI is not configured.'
    );
  }

  if (deviceModelInitialized) {
    return;
  }

  console.log(
    'Initializing PrivateLens on-device AI...'
  );

  await localModel.initializeDeviceModel(
    (progress) => {

      // Depending on SDK version this may be a number or
      // progress-like object. Keep the logging defensive.
      let value = progress;

      if (
        progress &&
        typeof progress === 'object' &&
        'progress' in progress
      ) {
        value = progress.progress;
      }

      const numeric =
        typeof value === 'number'
          ? value
          : 0;

      const percent =
        Math.round(numeric * 100);

      console.log(
        `On-device model setup: ${percent}%`
      );

      if (onProgress) {
        onProgress(percent);
      }
    }
  );

  deviceModelInitialized = true;

  console.log(
    'PrivateLens ON-DEVICE MODEL READY'
  );
}


// ============================================================
// LOCAL PRIVACY SCAN
// ============================================================

export async function scanLocally(text) {

  if (!text?.trim()) {
    throw new Error(
      'No text was provided for the privacy scan.'
    );
  }

  const started = performance.now();


  // ==========================================================
  // STEP 1
  // CAPTURE KNOWN PERSON IDENTITIES LOCALLY
  // ==========================================================
  //
  // IMPORTANT:
  // We capture explicitly identified people BEFORE replacing
  // their names.
  //
  // Example:
  //
  // Employee: Alice Johnson
  //
  // gives us local aliases:
  //
  // Alice Johnson
  // Alice
  // Johnson
  //
  // These aliases exist only in local JavaScript memory.
  // They are NEVER sent to cloud AI.
  //

  const personAliases = new Set();

  const employeePattern =
    /Employee:\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)/g;

  for (const match of text.matchAll(employeePattern)) {

    const firstName = match[1];
    const lastName = match[2];
    const fullName =
      `${firstName} ${lastName}`;

    personAliases.add(fullName);
    personAliases.add(firstName);
    personAliases.add(lastName);
  }


  console.log(
    'Locally identified person aliases:',
    [...personAliases]
  );


  // ==========================================================
  // STEP 2
  // DETERMINISTIC PRIVACY GUARDRAILS
  // ==========================================================

  let deterministicSafeText = text;

  const byType = {};


  for (const rule of rules) {

    rule.re.lastIndex = 0;

    const matches = [
      ...deterministicSafeText.matchAll(
        rule.re
      )
    ];


    if (matches.length) {

      byType[rule.label] =
        (byType[rule.label] || 0) +
        matches.length;


      rule.re.lastIndex = 0;


      deterministicSafeText =
        deterministicSafeText.replace(
          rule.re,
          rule.replace
        );
    }
  }


  // ==========================================================
  // STEP 3
  // DETERMINISTIC PERSON-ALIAS REDACTION
  // ==========================================================
  //
  // This solves cases such as:
  //
  // Employee: Alice Johnson
  //
  // Alice is working on Project Phoenix.
  // Contact Alice at ...
  //
  // The Employee line has already become:
  //
  // Employee: [PERSON]
  //
  // We now remove later references to Alice as well.
  //

  let aliasDetectionCount = 0;


  const aliasesSorted =
    [...personAliases].sort(
      (a, b) =>
        b.length - a.length
    );


  for (const alias of aliasesSorted) {

    const escapedAlias =
      alias.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );


    const aliasRegex =
      new RegExp(
        `\\b${escapedAlias}\\b`,
        'gi'
      );


    const matches =
      deterministicSafeText.match(
        aliasRegex
      );


    if (matches?.length) {

      aliasDetectionCount +=
        matches.length;


      deterministicSafeText =
        deterministicSafeText.replace(
          aliasRegex,
          '[PERSON]'
        );
    }
  }


  if (aliasDetectionCount) {

    byType.Person =
      (byType.Person || 0) +
      aliasDetectionCount;
  }


  const deterministicCount =
    Object.values(byType).reduce(
      (a, b) => a + b,
      0
    );


  console.log(
    '========================================'
  );

  console.log(
    'PRIVATE LENS - LOCAL PRIVACY PIPELINE'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Deterministic detections:',
    byType
  );

  console.log(
    'Person aliases removed:',
    aliasDetectionCount
  );

  console.log(
    'Deterministic detection count:',
    deterministicCount
  );

  console.log(
    'Text after deterministic guardrails:',
    deterministicSafeText
  );


  // ==========================================================
  // STEP 4
  // VERIFY ON-DEVICE MODEL IS AVAILABLE
  // ==========================================================

  if (!localModel) {

    throw new Error(
      'On-device AI is not available because Firebase AI is not configured.'
    );
  }


  if (!deviceModelInitialized) {

    throw new Error(
      'On-device AI has not been initialized. Call initializeLocalAI() from the Scan Locally button before scanLocally().'
    );
  }


  // ==========================================================
  // STEP 5
  // ON-DEVICE SEMANTIC PRIVACY AI
  // ==========================================================

  const localPrompt = `
Sanitize the following document according to the privacy policy
defined in your system instructions.

The deterministic privacy layer has already removed some structured
and explicitly identified personal information.

Pay particular attention to CONTEXTUAL sensitive information that
deterministic rules may not detect.

The document may already contain markers such as:

[PERSON]
[SSN REDACTED]
[EMAIL REDACTED]
[PHONE REDACTED]

Preserve all existing privacy markers exactly.

REMOVE OR SANITIZE:

- remaining personal names
- family-member identities
- personally associated locations
- home addresses
- personally associated schools
- medical procedures
- diagnoses
- treatments
- health information
- medical reasons for absence
- account identifiers
- employee identifiers
- other contextual personally identifying information

PRESERVE BUSINESS INFORMATION:

- project names

- company names

- organization names

- employer names

- department names

- team names

- budgets

- project deadlines

- deployment dates

- approval deadlines

- security risks

- project status

- operational requirements

- business-relevant absence duration

PROJECT AND BUSINESS ENTITY PROTECTION:

Names associated with projects, programs, initiatives, products,
platforms, applications, systems, teams, departments, companies,
and organizations are BUSINESS INFORMATION, not person names.

Preserve them unless the name itself contains personal information.

Examples:

Project Nova
Project Horizon
Project Atlas
Program Apollo
Enterprise Plus
Enterprise Technology
Payments Operations

must remain unchanged.

Never convert:

"Project Nova"

into:

"Project [PERSON]"

If a person's name and project name occur in the same sentence:

"Jonathan Miller leads Project Nova."

must become:

"[PERSON] leads Project Nova."
IMPORTANT:

Company and organization names are NOT employee identifiers.
For example:

"Daniel works at Riverstone Bank."

should become:

"[PERSON] works at Riverstone Bank."

Do NOT replace Riverstone Bank with [EMPLOYEE IDENTIFIER]
Only actual identifiers assigned to people, such as EMP-847291,

employee number 39281, or worker ID W-19283, should become

[EMPLOYEE IDENTIFIER]

Do NOT replace project deadlines or deployment dates with [DATE].

For example:

"Project Phoenix has a $75,000 budget and is scheduled for
production deployment on December 20."

should remain unchanged.

"Executive approval is required by December 15."

should remain unchanged.

If medical information and business information occur in the
same sentence, remove the medical information while preserving
the useful business information.

Example:

"[PERSON] will undergo knee surgery next month and will be out
of work for approximately three weeks."

should become:

"[PERSON] will be out of work for approximately three weeks
next month."
MEDICAL MINIMIZATION:

Medical privacy includes:

- diagnoses
- diseases
- conditions
- medications
- procedures
- treatments
- specialist names
- medical facilities when associated with treatment
- medical appointments
- medical reasons for absence

Do not leave a diagnosis visible simply because another part of
the sentence was sanitized.

For example:

"His wife Rebecca is undergoing treatment for multiple sclerosis
at UCHealth and he may need five business days away from work."

should become:

"His wife [PERSON] has [MEDICAL INFORMATION], and he may need
five business days away from work."

When possible, prefer removing unnecessary medical context entirely
while preserving the business impact:

"[PERSON] may need five business days away from work."

Never preserve:

"multiple sclerosis"

"breast cancer"

"diabetes"

"cardiology appointment"

"knee surgery"

when those terms describe an identifiable person's health.
Do NOT summarize.

Do NOT explain what you changed.

Return the COMPLETE sanitized document and nothing else.

DOCUMENT:

${deterministicSafeText}
`;


  console.log(
    'Sending deterministic-safe text to ON-DEVICE AI'
  );


  const localResult =
    await localModel.generateContent(
      localPrompt
    );


  const aiSanitizedText =
    localResult.response
      .text()
      .trim();


  const inferenceSource =
    localResult.response
      .inferenceSource;


  console.log(
    'ON-DEVICE AI RESPONSE:',
    aiSanitizedText
  );


  console.log(
    'LOCAL INFERENCE SOURCE:',
    inferenceSource
  );


  // ==========================================================
  // STEP 6
  // FAIL-CLOSED PRIVACY CHECK
  // ==========================================================

  const normalizedSource =
    String(
      inferenceSource || ''
    ).toLowerCase();


  if (
    normalizedSource !==
    'on_device'
  ) {

    throw new Error(
      `PRIVACY BLOCK: Expected ON_DEVICE inference but received "${inferenceSource || 'UNKNOWN'}". Sanitized content will not proceed.`
    );
  }


  // ==========================================================
  // STEP 7
  // FINAL DETERMINISTIC SAFETY PASS
  // ==========================================================
  //
  // The local AI must not accidentally reproduce structured
  // identifiers or known person aliases.
  //

  let finalSafeText =
    aiSanitizedText;


  // Structured PII safety pass

  for (const rule of rules) {

    rule.re.lastIndex = 0;

    finalSafeText =
      finalSafeText.replace(
        rule.re,
        rule.replace
      );
  }


  // Known-person alias safety pass

  for (const alias of aliasesSorted) {

    const escapedAlias =
      alias.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );


    const aliasRegex =
      new RegExp(
        `\\b${escapedAlias}\\b`,
        'gi'
      );


    finalSafeText =
      finalSafeText.replace(
        aliasRegex,
        '[PERSON]'
      );
  }


  // ==========================================================
  // STEP 8
  // PRIVACY LEAK CHECK
  // ==========================================================
  //
  // Verify known aliases cannot leave the local privacy layer.
  //

  const leakedAliases =
    aliasesSorted.filter(
      alias => {

        const escapedAlias =
          alias.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          );


        const aliasRegex =
          new RegExp(
            `\\b${escapedAlias}\\b`,
            'i'
          );


        return aliasRegex.test(
          finalSafeText
        );
      }
    );


  if (leakedAliases.length) {

    console.error(
      'PRIVACY LEAK DETECTED:',
      leakedAliases
    );


    throw new Error(
      'PRIVACY BLOCK: A known personal identity remained after local sanitization.'
    );
  }


  const latencyMs =
    Math.round(
      performance.now() -
      started
    );


  console.log(
    'FINAL SANITIZED TEXT:',
    finalSafeText
  );


  console.log(
    'Known identity leak check: PASSED'
  );


  console.log(
    'LOCAL PRIVACY LATENCY:',
    latencyMs,
    'ms'
  );


  console.log(
    '========================================'
  );


  return {

    sanitizedText:
      finalSafeText,

    count:
      deterministicCount,

    byType,

    deterministic: {

      count:
        deterministicCount,

      byType,

      aliasesRemoved:
        aliasDetectionCount
    },

    semanticAI: {

      used:
        true,

      inferenceSource:
        inferenceSource ||
        'ON_DEVICE'
    },

    privacyValidation: {

      knownIdentityLeakCheck:
        true,

      knownAliasesRemaining:
        0
    },

    execution: {

      model:
        'Browser On-Device AI',

      location:
        inferenceSource ||
        'ON_DEVICE',

      latencyMs,

      simulated:
        false,

      inferenceSource:
        inferenceSource ||
        'ON_DEVICE'
    }
  };
}

// ============================================================
// LAYER 3
// CLOUD AI ANALYSIS
// ============================================================
//
// IMPORTANT:
//
// This function must ONLY receive the sanitized output produced
// by scanLocally().
//
// Raw text should NEVER be passed to this function.
//

export async function analyzeSanitized(
  text,
  type
) {

  if (!firebaseConfigured) {
    throw new Error(
      'Firebase is not configured.'
    );
  }


  if (!text?.trim()) {
    throw new Error(
      'No sanitized text was provided to cloud AI.'
    );
  }


  const started =
    performance.now();


  // ----------------------------------------------------------
  // Cloud-only model
  // ----------------------------------------------------------

  const cloudAI =
    getAI(
      firebaseApp,
      {
        backend:
          new GoogleAIBackend()
      }
    );


  const model =
    getGenerativeModel(
      cloudAI,
      {

        mode:
          InferenceMode.ONLY_IN_CLOUD,

        inCloudParams: {

          model:
            import.meta.env
              .VITE_FIREBASE_CLOUD_MODEL ||
            'gemini-3.5-flash-lite'
        }
      }
    );


  // ----------------------------------------------------------
  // CLOUD TASKS
  // ----------------------------------------------------------

  const tasks = {

    summary:
      `Summarize the following sanitized document concisely.
Return only the summary text.`,

    actions:
      `Extract the concrete action items from the following sanitized document.
Return one action per line prefixed with a dash.`,

    risks:
      `Identify the most important risks or issues in the following sanitized document.
Return a concise risk statement.`
  };


  const task =
    tasks[type];


  if (!task) {
    throw new Error(
      `Unsupported analysis type: ${type}`
    );
  }


  const prompt = `${task}

IMPORTANT:

The document has already passed through PrivateLens privacy protection.

The privacy pipeline contains:

1. deterministic privacy rules
2. on-device semantic privacy AI

Do not attempt to reconstruct, infer, guess, or identify
any redacted personal information.

Use only the remaining business-safe information.

SANITIZED DOCUMENT:

${text}`;


  // ----------------------------------------------------------
  // DEBUG / DEMO LOGGING
  // ----------------------------------------------------------

  console.log(
    '========================================'
  );

  console.log(
    'PRIVATE LENS - CLOUD AI PIPELINE'
  );

  console.log(
    '========================================'
  );

  console.log(
    'CLOUD ANALYSIS TYPE:',
    type
  );

  console.log(
    'Sending SANITIZED text to Firebase AI Logic'
  );

  console.log(
    'Contains SSN redaction:',
    text.includes(
      '[SSN REDACTED]'
    )
  );

  console.log(
    'Contains email redaction:',
    text.includes(
      '[EMAIL REDACTED]'
    )
  );

  console.log(
    'Contains person redaction:',
    text.includes(
      '[PERSON]'
    )
  );

  console.log(
    'Contains medical redaction:',
    text.includes(
      '[MEDICAL INFORMATION]'
    )
  );


  // ----------------------------------------------------------
  // CLOUD GENERATION
  // ----------------------------------------------------------

  const result =
    await model.generateContent(
      prompt
    );


  const output =
    result.response
      .text()
      .trim();


  console.log(
    'CLOUD AI RESPONSE:',
    output
  );

  console.log(
    'CLOUD INFERENCE SOURCE:',
    result.response
      .inferenceSource
  );


  // ----------------------------------------------------------
  // Shape result for existing UI
  // ----------------------------------------------------------

  let shaped;


  if (type === 'summary') {

    shaped = {

      title:
        'Summary',

      body:
        output
    };

  } else if (type === 'actions') {

    shaped = {

      title:
        'Key actions',

      items:
        output
          .split('\n')
          .map(
            line =>
              line
                .replace(
                  /^[-*•]\s*/,
                  ''
                )
                .trim()
          )
          .filter(Boolean)
    };

  } else {

    shaped = {

      title:
        'Potential risks',

      risk:
        output
    };
  }


  const latencyMs =
    Math.round(
      performance.now() -
      started
    );


  return {

    ...shaped,

    execution: {

      model:
        import.meta.env
          .VITE_FIREBASE_CLOUD_MODEL ||
        'gemini-3.5-flash-lite',

      location:
        result.response
          .inferenceSource ||
        'IN_CLOUD',

      latencyMs,

      simulated:
        false,

      inferenceSource:
        result.response
          .inferenceSource ||
        'IN_CLOUD'
    },

    inputWasSanitized:
      true
  };
}


// ============================================================
// FIREBASE CLOUD TEST
// ============================================================

export async function testCloudAI() {

  if (!firebaseConfigured) {
    throw new Error(
      'Firebase is not configured.'
    );
  }


  const cloudAI =
    getAI(
      firebaseApp,
      {
        backend:
          new GoogleAIBackend()
      }
    );


  const model =
    getGenerativeModel(
      cloudAI,
      {

        mode:
          InferenceMode.ONLY_IN_CLOUD,

        inCloudParams: {

          model:
            import.meta.env
              .VITE_FIREBASE_CLOUD_MODEL ||
            'gemini-3.5-flash-lite'
        }
      }
    );


  const result =
    await model.generateContent(
      'Explain hybrid AI in one sentence.'
    );


  console.log(
    'AI RESPONSE:',
    result.response.text()
  );

  console.log(
    'INFERENCE SOURCE:',
    result.response
      .inferenceSource
  );


  return result.response.text();
}