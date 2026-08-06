/* ============================================================================
   Self-Insure · account.js
   THE canonical data model. Every screen reads these exact field names.
   All money is integer dollars; app.js formats it. Never hard-code formatted
   money in markup. Treat SI.account as frozen-by-convention (read-only); the
   mutable session layer lives in si-session-overrides (see app.js getState()).
   ========================================================================== */
window.SI = window.SI || {};

SI.account = {
  /* ---------- MEMBER ---------- */
  member: {
    id: "MEM-204871",
    firstName: "Eleanor",
    lastName: "Marsh",
    fullName: "Eleanor Marsh",
    initials: "EM",
    email: "eleanor.marsh@gmail.com",
    phone: "(614) 555-0142",
    address: {
      line1: "418 Walhalla Road",
      city: "Columbus",
      state: "OH",
      zip: "43202"
    },
    memberSince: "2020-01-01",       // ISO; render "Member since 2020"
    memberSinceYear: 2020,
    avatarInitials: "EM",
    paperless: true,
    language: "en-US"
  },

  /* ---------- POLICY ---------- */
  policy: {
    number: "SI-OH-204871",
    product: "HO-3 Homeowners",
    productCode: "HO3",
    form: "HO-3 (Special Form)",
    status: "ACTIVE",                // ACTIVE | PENDING | LAPSED | CANCELLED
    termStart: "2026-01-01",
    termEnd: "2027-01-01",
    underwrittenSameDay: true,
    // Confidence of the ORIGINAL underwriting decision (application → bind). This is a
    // DIFFERENT event from the roof claim's assessment confidence (claims[0].decisionConfidence
    // = 0.97). Keep these scoped: the why_approved assistant answer + underwriting.html speak to
    // THIS figure (0.96, "your application was underwritten at 96%"); the claim surfaces speak to
    // the claim's 0.97. They are two events, not a contradiction — never conflate them.
    underwritingConfidence: 0.96,
    boundDate: "2020-01-01",
    propertyAddress: {
      line1: "418 Walhalla Road",
      city: "Columbus",
      state: "OH",
      zip: "43202"
    },
    yearBuilt: 1996,
    roofYear: 2016,
    constructionType: "Frame",
    squareFeet: 2180,
    ropTermYears: 10,                // ACTIVE ROP tier she is enrolled in (Bronze 10yr)
    ropPolicyYear: 6                 // "year 6 of 10"
  },

  /* ---------- COVERAGES ---------- */
  // Order matters: render A→F in this order. amount = dollars of coverage.
  coverages: [
    { code: "A", name: "Dwelling",          amount: 420000, blurb: "Rebuilds your home's structure after a covered loss." },
    { code: "B", name: "Other structures",  amount: 42000,  blurb: "Detached structures — fence, shed, detached garage." },
    { code: "C", name: "Personal property", amount: 210000, blurb: "Your belongings: furniture, electronics, clothing." },
    { code: "D", name: "Loss of use",       amount: 84000,  blurb: "Living expenses if your home is uninhabitable." },
    { code: "E", name: "Liability",         amount: 300000, blurb: "Protects you if you're responsible for injury or damage." },
    { code: "F", name: "Medical payments",  amount: 5000,   blurb: "Medical bills for guests hurt on your property." }
  ],

  deductibles: {
    // All-perils is the flat deductible for most covered losses — INCLUDING hail,
    // so the canonical roof/hail claim CLM-31182 correctly nets out only $1,500.
    allPerils: { type: "flat",    amount: 1500,  label: "$1,500",
                 appliesTo: "Most covered losses, including hail" },
    // The percentage deductible is WINDSTORM-specific (named-storm / high-wind),
    // NOT hail — kept distinct from the all-perils figure the hail claim applies.
    // Key stays "windHail" for back-compat; user-facing label reads "Windstorm".
    windHail:  { type: "percent", percent: 1, basisCode: "A", // 1% of Coverage A
                 name: "Windstorm", computedAmount: 4200, label: "1% of Dwelling ($4,200)",
                 appliesTo: "Windstorm losses only" }
  },

  /* ---------- BILLING ---------- */
  billing: {
    premiumAnnual: 1500,
    premiumMonthly: 125,
    cadence: "monthly",              // monthly | annual
    autopay: true,
    paperless: true,
    balance: 0,                      // current amount due
    status: "Up to date",
    paidToDate: 9000,                // cumulative premium paid since inception
    nextPaymentAmount: 125,
    nextPaymentDate: "2026-07-01",
    nextPaymentDay: 1,               // "the 1st"
    paymentMethod: {
      type: "card",
      brand: "Visa",
      last4: "4242",
      exp: "08/28",
      label: "Visa ending 4242"
    },
    // 6 most recent payments (newest first). Used by billing history table.
    history: [
      { id: "PMT-0066", date: "2026-06-01", amount: 125, method: "Visa •4242", status: "Paid", kind: "premium" },
      { id: "PMT-0065", date: "2026-05-01", amount: 125, method: "Visa •4242", status: "Paid", kind: "premium" },
      { id: "PMT-0064", date: "2026-04-01", amount: 125, method: "Visa •4242", status: "Paid", kind: "premium" },
      { id: "PMT-0063", date: "2026-03-01", amount: 125, method: "Visa •4242", status: "Paid", kind: "premium" },
      { id: "PMT-0062", date: "2026-02-01", amount: 125, method: "Visa •4242", status: "Paid", kind: "premium" },
      { id: "PMT-0061", date: "2026-01-01", amount: 125, method: "Visa •4242", status: "Paid", kind: "premium" }
    ]
  },

  /* ---------- RETURN OF PREMIUM ---------- */
  rop: {
    enrolledTier: "Bronze",          // Eleanor's active tier
    enrolledTermYears: 10,
    policyYear: 6,                   // year 6 of 10
    claimsFree: true,
    onTrack: true,
    // Her Bronze track specifics:
    bronzeReturnAmount: 7500,        // 50% of $15,000 ten-year premium
    bronzeReturnAtYear: 10,
    bronzeReturnDate: "2030-01-01",
    paidIntoTrack: 9000,             // paid so far (= billing.paidToDate)
    // The full tier schedule (always render all three; mark Bronze "current").
    tiers: [
      { key: "bronze", name: "Bronze", pct: 50,  termYears: 10, returnAmount: 7500,  current: true,  status: "On track" },
      { key: "silver", name: "Silver", pct: 75,  termYears: 20, returnAmount: 22500, current: false, status: "Available at renewal" },
      { key: "gold",   name: "Gold",   pct: 100, termYears: 30, returnAmount: 45000, current: false, status: "Available at renewal" }
    ],
    // For the progress visual: 6 of 10 years complete = 60%.
    progressPct: 60
  },

  /* ---------- CLAIMS ---------- */
  // One ACTIVE claim, approved today. Otherwise claims-free.
  claims: [
    {
      id: "CLM-31182",
      type: "Property damage",
      peril: "Hail",
      area: "Roof",
      title: "Roof / hail damage",
      status: "Approved",            // Submitted | AI review | Approved | Paid | Closed | Denied | Referred
      statusStage: 4,                // 1 Submitted · 2 AI assessment · 3 Decision · 4 Payment
      filedDate: "2026-06-24",
      filedTime: "9:06 AM",
      filedDisplay: "Today · 9:06 AM",
      aiAssessed: true,
      grossAmount: 12900,            // assessed damage
      deductibleApplied: 1500,
      netPayout: 11400,              // grossAmount - deductible
      payoutMethod: "ACH to Visa •4242 / linked account",
      fundsTiming: "Same day",
      decisionConfidence: 0.97,      // confidence of THIS CLAIM's AI assessment (distinct from
                                     // policy.underwritingConfidence 0.96, the original bind decision)
      assessSeconds: 38,             // canonical AI assessment time; drives the "analyzed in 38 seconds" copy

      // Timeline events (most recent last). Renders the live tracker.
      timeline: [
        { stage: 1, label: "Claim submitted",         time: "9:06 AM", done: true, detail: "Photos and details received." },
        { stage: 2, label: "AI damage assessment",    time: "9:07 AM", done: true, detail: "Imagery + policy data analyzed in 38 seconds." },
        { stage: 3, label: "Coverage & deductible",   time: "9:08 AM", done: true, detail: "Hail confirmed as a covered peril; $1,500 all-perils deductible applied." },
        { stage: 4, label: "Approved — payout issued", time: "9:09 AM", done: true, detail: "$11,400 approved, net of deductible. Funds same day." }
      ]
    }
  ],

  /* ---------- DOCUMENTS ---------- */
  documents: [
    { id: "DOC-DEC", name: "Declarations page",            type: "PDF",  category: "Policy", date: "2026-01-01", size: "184 KB", primary: true },
    { id: "DOC-POL", name: "Policy contract",              type: "PDF",  category: "Policy", date: "2026-01-01", size: "612 KB" },
    { id: "DOC-ROP", name: "Return-of-Premium addendum",   type: "PDF",  category: "Policy", date: "2026-01-01", size: "96 KB" },
    { id: "DOC-ID",  name: "Digital ID card",              type: "Card", category: "Proof",  date: "2026-01-01", size: "—", isIdCard: true },
    { id: "DOC-CLM", name: "Claim CLM-31182 summary",      type: "PDF",  category: "Claims", date: "2026-06-24", size: "142 KB" }
  ],

  /* ---------- ACTIVITY / NOTIFICATIONS FEED ---------- */
  // newest first; powers the bell dropdown + dashboard "Recent activity".
  activity: [
    { id: "ACT-09", icon: "check", tone: "ai",      date: "2026-06-24", time: "9:09 AM",  title: "Claim approved",       body: "CLM-31182 approved for $11,400. Funds arriving today.", link: "claims.html",    unread: true },
    { id: "ACT-08", icon: "claim", tone: "info",    date: "2026-06-24", time: "9:06 AM",  title: "Claim submitted",      body: "Roof / hail claim received and sent to AI review.",     link: "claims.html",    unread: true },
    { id: "ACT-07", icon: "card",  tone: "neutral", date: "2026-06-01", time: "12:00 AM", title: "Payment received",     body: "$125 paid via Visa •4242. Thank you.",                  link: "billing.html",   unread: false },
    { id: "ACT-06", icon: "rop",   tone: "ai",      date: "2026-01-01", time: "12:00 AM", title: "ROP milestone update", body: "Year 6 of 10 complete — on track for $7,500 back.",     link: "policy.html",    unread: false },
    { id: "ACT-05", icon: "doc",   tone: "neutral", date: "2026-01-01", time: "12:00 AM", title: "Policy renewed",       body: "Your 2026 term is active. Declarations page available.", link: "documents.html", unread: false }
  ]
};

/* convenience derived getters (computed once, not stored as drift-prone copies) */
SI.derived = {
  get coverageA() { return SI.account.coverages.find(function (c) { return c.code === "A"; }).amount; },
  get totalDwellingPlusContents() {
    var a = SI.account.coverages.find(function (c) { return c.code === "A"; }).amount;
    var c = SI.account.coverages.find(function (c) { return c.code === "C"; }).amount;
    return a + c;
  },
  get ropRemainingYears() { return SI.account.rop.enrolledTermYears - SI.account.rop.policyYear; }, // 4
  get nextRenewal() { return SI.account.policy.termEnd; }
};

/* ---------- NEW-APPLICANT DRAFT (intake → underwriting) ---------- */
// A separate mutable draft, NOT the canonical account. Stored in sessionStorage
// under 'si-quote-draft'. Seeded with realistic defaults so the demo flows.
SI.quoteDraftDefault = {
  step: 1,                          // current wizard step (1..5)
  applicant: {
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  },
  property: {
    line1: "",
    city: "Columbus",
    state: "OH",                    // launch states: OH, WI (select limited to these two)
    zip: "43215",
    yearBuilt: 1998,
    squareFeet: 2000,
    constructionType: "Frame",      // Frame | Masonry | Brick
    roofYear: 2018,
    stories: 2,
    occupancy: "Primary residence"
  },
  coverageSelections: {
    dwelling: 400000,               // user can nudge with a slider; drives others
    deductible: 1500,               // 1000 | 1500 | 2500
    ropTier: "bronze"               // bronze | silver | gold (default bronze)
  },
  // populated by the underwriting step:
  quote: {
    premiumAnnual: null,            // ~1500 on approval
    premiumMonthly: null,
    decision: null,                 // "approved" | "referred"
    decisionConfidence: null,
    dataPointsAggregated: null,     // ~140
    secondsToUnderwrite: null       // < 30
  }
};

/* Freeze-by-convention: deep-freeze the canonical account so screens can't drift it. */
(function deepFreeze(o) {
  if (!o || typeof o !== "object") return o;
  Object.getOwnPropertyNames(o).forEach(function (k) {
    var v = o[k];
    if (v && typeof v === "object" && !Object.isFrozen(v)) deepFreeze(v);
  });
  return Object.freeze(o);
})(SI.account);
