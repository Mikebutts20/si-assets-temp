/* ============================================================================
   Self-Insure · intents.js
   The AI assistant intent map (pure data). Consumed by app.js matchIntent().
   Each intent: id, keywords (incl. synonyms), answer(a) -> string (account-aware,
   light templating from SI.account), optional cards[] and chips[].
   - cards: { kind:'stat'|'contact', ... } rendered by app.js after the stream.
   - chips: { label, action } where action is { route:'file.html' } |
            { open:'assistant'|'paySheet'|'idCard'|'fileClaim' } | { send:'text' }.
   matchIntent lowercases, strips punctuation, scores keyword overlaps; ties break
   on specificity (more distinct keywords matched). Falls back to greeting_help.
   All strings use **markdown-ish bold** (**...**) that app.js renders to <strong>.
   ========================================================================== */
window.SI = window.SI || {};

SI.intents = [
  /* 1 */ {
    id: "payments_up_to_date",
    keywords: ["up to date", "owe", "do i owe", "owe anything", "account current",
               "current", "behind", "past due", "balance", "all set", "paid up"],
    answer: function (a) {
      return "You're all set, " + a.member.firstName + " — your balance is **$0** and your account " +
        "is up to date. Autopay is on, so your next payment of **$125** will run automatically on " +
        "**July 1**.";
    },
    cards: [{ kind: "stat", label: "Balance", value: "$0", sub: "Up to date", tone: "ai" }],
    chips: [
      { label: "See billing", action: { route: "billing.html" } },
      { label: "Turn off autopay", action: { route: "billing.html#autopay" } }
    ]
  },

  /* 2 */ {
    id: "next_payment",
    keywords: ["next payment", "next bill", "when is my payment", "how much is due",
               "due", "when do i pay", "payment date", "monthly payment", "bill due"],
    answer: function (a) {
      return "Your next payment is **$125**, due **July 1**. It'll be charged automatically to your " +
        "**Visa ending 4242** since autopay is on — you don't need to do anything.";
    },
    cards: [{ kind: "stat", label: "Next payment", value: "$125", sub: "Jul 1 · Visa •4242", tone: "ai" }],
    chips: [
      { label: "Pay it now", action: { open: "paySheet" } },
      { label: "Manage autopay", action: { route: "billing.html#autopay" } }
    ]
  },

  /* 3 */ {
    id: "water_damage_coverage",
    keywords: ["water damage", "water", "pipe", "burst pipe", "burst", "leak", "leaking",
               "flood", "flooding", "overflow", "overflowing", "appliance"],
    answer: function (a) {
      return "Sudden, accidental water damage — like a burst pipe or an overflowing appliance — is " +
        "covered under your HO-3 policy, drawing on your **Personal property ($210,000)** and " +
        "**Dwelling ($420,000)** coverage, after your **$1,500** deductible. One thing to know: " +
        "**flooding** from outside (rising water, storm surge) isn't covered by a standard HO-3 and " +
        "needs separate flood insurance. Want me to explain the difference or start a claim?";
    },
    chips: [
      { label: "File a claim", action: { route: "claims.html#file" } },
      { label: "See full coverage", action: { route: "policy.html" } },
      { label: "Talk to a person", action: { send: "I'd like to talk to a person" } }
    ]
  },

  /* 4 */ {
    id: "deductible",
    keywords: ["deductible", "out of pocket", "how much do i pay", "pay out of pocket",
               "excess", "wind hail deductible", "windstorm deductible", "all perils"],
    answer: function (a) {
      return "You have two deductibles: an **all-perils deductible of $1,500** that applies to most " +
        "losses — including hail — and a separate **windstorm deductible of 1% of your dwelling, about " +
        "$4,200**, that applies only to high-wind and named-storm losses. Your roof claim was hail, so " +
        "the $1,500 all-perils deductible applied — that's why your payout was $11,400 of the $12,900 assessed.";
    },
    cards: [{ kind: "stat", label: "All-perils", value: "$1,500", sub: "Windstorm 1% ($4,200)", tone: "brand" }],
    chips: [
      { label: "See my claim", action: { route: "claims.html" } },
      { label: "Coverage details", action: { route: "policy.html" } }
    ]
  },

  /* 5 */ {
    id: "rop_how_much_when",
    keywords: ["get back", "return", "premium back", "money back", "rop", "refund",
               "return of premium", "how much do i get back", "when do i get",
               "claims free", "back at year"],
    answer: function (a) {
      return "You're on the **Bronze** tier — 50% of your premiums back if you stay claims-free. At " +
        "your $1,500/year premium, that's **$7,500 back at year 10 (around January 2030)**. You're in " +
        "**year 6 of 10** right now and **on track**. If you renew into longer terms, **Silver** " +
        "returns 75% ($22,500 at 20 years) and **Gold** returns 100% ($45,000 at 30 years).";
    },
    cards: [{ kind: "stat", label: "Bronze · Return of premium", value: "$7,500", sub: "Year 6 of 10 · On track", tone: "ai" }],
    chips: [
      { label: "See ROP details", action: { route: "policy.html#rop" } },
      { label: "Compare tiers", action: { route: "policy.html#rop" } }
    ]
  },

  /* 6 */ {
    id: "file_claim",
    keywords: ["file a claim", "file claim", "report damage", "report a claim",
               "something happened", "i need to file", "new claim", "make a claim",
               "damage to my", "start a claim"],
    answer: function (a) {
      return "I'm sorry that happened — let's get it handled. I can start a claim for you right now. " +
        "Most claims are AI-assessed in under a minute, and your **$1,500 all-perils deductible** " +
        "would apply. Tap below to begin and add a few photos.";
    },
    chips: [
      { label: "Start a claim", action: { route: "claims.html#file" } },
      { label: "What's covered?", action: { send: "What does my policy cover?" } },
      { label: "Talk to a person", action: { send: "I'd like to talk to a person" } }
    ]
  },

  /* 7 */ {
    id: "claim_status",
    keywords: ["status of my claim", "claim status", "where's my payout", "wheres my payout",
               "claim update", "my claim", "clm", "31182", "payout", "is my claim approved"],
    answer: function (a) {
      var c = a.claims[0];
      return "Your claim **CLM-31182** (roof / hail) is **Approved**. Assessed damage was $12,900; " +
        "after your $1,500 deductible, **$11,400** was approved and is arriving **today** to your " +
        "Visa •4242. The **claim damage assessment** took about " + c.assessSeconds + " seconds this morning.";
    },
    cards: [{ kind: "stat", label: "CLM-31182 · Approved", value: "$11,400", sub: "Arriving today", tone: "ai" }],
    chips: [
      { label: "Track claim", action: { route: "claims.html" } },
      { label: "Download summary", action: { route: "claims.html" } }
    ]
  },

  /* 8 */ {
    id: "why_approved",
    keywords: ["why was i approved", "how does the ai", "underwriting work", "how were you so fast",
               "ai underwriting", "how fast", "instant decision", "how were you fast",
               "how does underwriting", "model"],
    answer: function (a) {
      var conf = Math.round((a.claims[0].decisionConfidence) * 100); // single source of truth (account.js → 97%)
      return "When you applied, our model aggregated **~140 data points** about your " +
        "home — property records, roof imagery, catastrophe exposure, replacement cost — in under 3 " +
        "seconds, then underwrote the risk in under 30 seconds at **" + conf + "% confidence**. Your home was a " +
        "clean, well-maintained risk with no prior losses, so you were **approved instantly** at " +
        "**$1,500/year**. A small share of applications get referred to a human underwriter — yours " +
        "didn't.";
    },
    chips: [
      { label: "See my coverage", action: { route: "policy.html" } },
      { label: "How's my premium set?", action: { send: "How is my premium set?" } }
    ]
  },

  /* 8b — pricing / "how is my premium set" */ {
    id: "premium_pricing",
    keywords: ["premium set", "how is my premium", "how is my premium set", "how is my quote priced",
               "how do you price", "how is it priced", "how is the price", "set my premium",
               "why do i pay", "how is my rate", "how much do you charge", "pricing"],
    answer: function (a) {
      return "Your premium isn't a generic table rate — our model prices the specific risk of your " +
        "home. When you were underwritten, it aggregated **~140 data points** (property records, roof " +
        "and satellite imagery, catastrophe exposure, and replacement cost) and set your rate from that. " +
        "The biggest drivers are your **dwelling amount ($420,000)**, your **$1,500 deductible**, and " +
        "roof/construction. Because our expense ratio is just **8% vs. 25–30% industry**, more of every " +
        "dollar funds your coverage — and the **$7,500** you're on track to get back. That's how you " +
        "land at **$1,500/year**.";
    },
    cards: [{ kind: "stat", label: "Your premium", value: "$1,500", sub: "/yr · 8% expense ratio", tone: "brand" }],
    chips: [
      { label: "Why was I approved?", action: { send: "How does the AI underwriting work?" } },
      { label: "See my coverage", action: { route: "policy.html" } },
      { label: "How much do I get back?", action: { send: "How much do I get back and when?" } }
    ]
  },

  /* 9 */ {
    id: "update_autopay",
    keywords: ["update autopay", "change my card", "turn autopay", "autopay on or off",
               "autopay", "update card", "change card", "payment method", "card on file",
               "turn off autopay", "turn on autopay"],
    answer: function (a) {
      return "You're on autopay — **$125** runs to your **Visa ending 4242** on the 1st of each month. " +
        "I can take you to billing to update your card, switch to annual billing, or turn autopay off. " +
        "What would you like to do?";
    },
    chips: [
      { label: "Update card", action: { route: "billing.html#autopay" } },
      { label: "Turn off autopay", action: { route: "billing.html#autopay" } },
      { label: "Switch to annual", action: { route: "billing.html#autopay" } }
    ]
  },

  /* 10 */ {
    id: "change_or_cancel_coverage",
    keywords: ["cancel my policy", "cancel policy", "change my coverage", "change coverage",
               "lower my premium", "add coverage", "cancel", "reduce coverage",
               "increase coverage", "adjust coverage", "endorsement"],
    answer: function (a) {
      return "I can help you change your coverage — adjusting your **dwelling ($420,000)**, deductible, " +
        "or adding endorsements — and show you how it affects your premium and your return of premium. " +
        "If you're thinking about cancelling, I'll connect you with a specialist first so you don't lose " +
        "the **$7,500** you're on track to get back. What are you trying to change?";
    },
    chips: [
      { label: "Adjust coverage", action: { route: "policy.html" } },
      { label: "Talk to a person", action: { send: "I'd like to talk to a person" } },
      { label: "Keep my ROP", action: { route: "policy.html#rop" } }
    ]
  },

  /* 11 */ {
    id: "documents",
    keywords: ["documents", "document", "declarations", "declaration", "dec page",
               "proof of insurance", "id card", "insurance card", "contract", "policy contract",
               "paperwork", "where are my documents"],
    answer: function (a) {
      return "Everything's in your document center: your **declarations page**, full **policy " +
        "contract**, **ROP addendum**, and your **digital ID card** (proof of insurance). Want me to " +
        "pull up your ID card or download your declarations?";
    },
    chips: [
      { label: "Open ID card", action: { open: "idCard" } },
      { label: "Download declarations", action: { route: "documents.html" } },
      { label: "All documents", action: { route: "documents.html" } }
    ]
  },

  /* 12 */ {
    id: "contact_human",
    keywords: ["talk to a human", "talk to a person", "call someone", "i need a person",
               "contact support", "real person", "speak to someone", "customer service",
               "phone number", "call you", "agent", "representative"],
    answer: function (a) {
      return "Of course — a real person is happy to help. You can reach our Columbus team at **(800) " +
        "555-0199**, Mon–Fri 8am–8pm ET, or email **help@self-insure.com**. Want me to request a " +
        "callback about your claim **CLM-31182**? I'll have someone reach out today.";
    },
    cards: [{
      kind: "contact",
      phone: "(800) 555-0199",
      email: "help@self-insure.com",
      hours: "Mon–Fri · 8am–8pm ET"
    }],
    chips: [
      { label: "Request a callback", action: { open: "callback" } },
      { label: "Email support", action: { open: "emailSupport" } }
    ]
  },

  /* 13 */ {
    id: "coverage_overview",
    keywords: ["what does my policy cover", "explain my coverage", "what's my ho-3",
               "whats my ho3", "ho-3", "ho3", "what am i covered for", "policy cover",
               "my coverage", "what's covered", "whats covered", "coverage overview"],
    answer: function (a) {
      return "Your HO-3 homeowners policy covers: **Dwelling $420,000**, **Other structures $42,000**, " +
        "**Personal property $210,000**, **Loss of use $84,000**, **Liability $300,000**, and " +
        "**Medical payments $5,000** — with a **$1,500** all-perils deductible. In plain terms: it " +
        "rebuilds your home and replaces your things after a covered loss, covers you if someone's hurt " +
        "on your property, and pays your living costs if you can't stay home. Want the detail on any " +
        "one of these?";
    },
    chips: [
      { label: "Coverage details", action: { route: "policy.html" } },
      { label: "Am I covered for water damage?", action: { send: "Am I covered for water damage?" } }
    ]
  },

  /* 14 — fallback + opener */ {
    id: "greeting_help",
    keywords: ["hi", "hello", "hey", "what can you do", "help", "good morning",
               "good afternoon", "yo", "start", "menu"],
    fallback: true,
    answer: function (a) {
      return "Hi " + a.member.firstName + " — I'm your Self-Insure assistant, and I know your policy " +
        "inside and out. I can tell you about your **payments**, **coverage**, your **$7,500 return of " +
        "premium**, your active **claim CLM-31182**, your **documents**, or connect you to a " +
        "**person**. What can I help with?";
    },
    chips: [
      { label: "When's my next payment?", action: { send: "When is my next payment?" } },
      { label: "What does my policy cover?", action: { send: "What does my policy cover?" } },
      { label: "How much do I get back?", action: { send: "How much do I get back and when?" } },
      { label: "What's my claim status?", action: { send: "What's the status of my claim?" } },
      { label: "Where are my documents?", action: { send: "Where are my documents?" } },
      { label: "Talk to a person", action: { send: "I'd like to talk to a person" } }
    ]
  }
];

/* The opener shown when a fresh assistant surface mounts with no transcript. */
SI.assistantOpener = {
  intentId: "greeting_help"
};
