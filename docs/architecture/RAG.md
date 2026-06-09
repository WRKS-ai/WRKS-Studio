# RAG in WRKS Studio

> How the agent "remembers" your business — explained in plain English, with diagrams, and pointed at the actual files in this repo.

---

## The 30-second version

**RAG** stands for **Retrieval-Augmented Generation**.

It's a pattern that solves a simple problem: large language models like Claude don't know anything about *your* business. They know English, they know how to write copy, they know how marketing works in general — but they don't know your brand name, who your customers are, or what you've already approved.

Instead of trying to teach Claude about your business (impossible — you can't retrain the model per user), we do this every time the agent talks to you:

1. **Retrieve** the relevant facts about your business from our database
2. **Augment** the prompt by injecting those facts right before Claude reads it
3. **Generate** the response — Claude now sounds like it knows you

The result is an agent that **acts like it has perfect memory** even though, technically, it's stateless between every turn.

---

## Why we need it — the LLM memory problem

A language model on its own works like this:

```
        ┌─────────────────────────────────────────────┐
        │                                             │
You ───►│  Claude (trained on the public internet)    │───► Generic answer
        │                                             │
        └─────────────────────────────────────────────┘
                       (knows nothing about you)
```

Every conversation starts from zero. The model has no idea you exist, has never seen your previous work, and has no way of carrying memory from one session to the next.

For a generic chatbot that's fine. For an AI agent that's supposed to make professional deliverables for your specific business, it's a fatal limitation. The vision in the WRKS brief — *"A hairdresser says: I want to make a social media promo on 20% haircuts for March"* — only works if the agent already knows:

- The brand name
- The visual style
- Past social posts that worked
- Past social posts that got rejected
- The hairdresser's tone of voice
- Their audience

None of that lives in Claude. It lives in your business profile, in our database. RAG is the bridge.

---

## The pattern, in one diagram

```
                ┌──────────────────────────────────────────────┐
                │                                              │
                │   1. RETRIEVE                                │
                │   Pull the right facts from the database     │
                │                                              │
                │   ┌────────────────────────────────────┐     │
You speak ─────►│   │  Supabase                          │     │
                │   │  ──────────                        │     │
                │   │  • business_profiles               │     │
                │   │  • memory_entries  (facts, prefs)  │     │
                │   │  • deliverables    (what's built)  │     │
                │   │  • approvals       (what landed)   │     │
                │   └────────────────────────────────────┘     │
                │                  │                           │
                │                  ▼                           │
                │   2. AUGMENT                                 │
                │   Format the facts into a "memory block"     │
                │   and concatenate it onto the system prompt  │
                │                                              │
                │   ┌────────────────────────────────────┐     │
                │   │  System prompt                     │     │
                │   │  ═══ BUSINESS MEMORY ═══           │     │
                │   │  Brand: <your brand>               │     │
                │   │  What you do: <your business>      │     │
                │   │  Style preferences: <picked refs>  │     │
                │   │  Recently approved: ...            │     │
                │   │  ═══ END MEMORY ═══                │     │
                │   │  + the original agent instructions │     │
                │   └────────────────────────────────────┘     │
                │                  │                           │
                │                  ▼                           │
                │   3. GENERATE                                │
                │   Claude reads the augmented prompt,         │
                │   then responds knowing your context         │
                │                                              │
                └──────────────────────────────────────────────┘
                                   │
                                   ▼
                           Personalized answer
                           that sounds like
                           the agent knows you
```

The "trick" is that **Claude itself is unchanged**. It's the same model serving every user. What changes is the *context* we hand it on each turn.

---

## Memory has three flavors

The agent memory research consensus (cognitive science + 2026 production patterns) separates memory into three types. We use all three.

```
       ┌──────────────────────────────────────────────────────────┐
       │                       MEMORY                             │
       └──────────────────────────────────────────────────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
            ▼                     ▼                     ▼
    ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
    │   SEMANTIC   │      │   EPISODIC   │      │   WORKING    │
    │              │      │              │      │              │
    │  FACTS       │      │  EVENTS      │      │  CURRENT     │
    │              │      │              │      │   SESSION    │
    │  • Brand     │      │  • Past      │      │              │
    │  • Audience  │      │    posts     │      │  • Live      │
    │  • Edge      │      │  • Past      │      │    transcript│
    │  • Style     │      │    pages     │      │  • Active    │
    │  • Voice     │      │  • Approvals │      │    page      │
    │              │      │  • Revisions │      │  • Focused   │
    │              │      │              │      │    item      │
    └──────────────┘      └──────────────┘      └──────────────┘
        Stored in            Stored in             Stored in
      memory_entries        deliverables         voice_sessions
       (kind=fact)           + approvals          (transcript)

       ALWAYS injected      Top-N injected        Per-turn fresh
        on every turn        + vector recall      (in-session)
```

| Flavor | What it is | Example | How we retrieve it |
|---|---|---|---|
| **Semantic** | Stable facts about the business | "Brand: Cinder & Bean. We sell single-origin coffee." | Direct SQL query by `kind` — always inject |
| **Episodic** | Specific events: things made, approved, rejected | "Last week's Instagram post got approved on the third revision; the version that landed used 'roasted Tuesday' as the hook" | Top-N most recent + vector similarity to current intent |
| **Working** | What's happening *right now* in the session | "User is currently viewing the landing-page hero and asked to shorten the headline" | Sent per-turn from the studio UI |

---

## How a single voice turn flows through RAG in WRKS Studio

Here's a real turn, mapped to the files in our codebase:

```
  ┌───────────────────────────────────────────────────────────────────┐
  │                                                                   │
  │  User speaks:                                                     │
  │  "Hey Brad, make the landing page headline shorter."              │
  │                                                                   │
  └───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
       ElevenLabs transcribes the audio (STT)
                              │
                              ▼
       ElevenLabs POSTs to our custom-LLM endpoint:
       POST /api/agent/converse
       ──────────────────────────────────────────────
       file: apps/app/src/app/api/agent/converse/route.ts
                              │
                              ▼
       ┌───────────────────────────────────────────────────────────┐
       │  STEP 1 — RETRIEVE                                        │
       │  ──────────────────                                       │
       │  composeMemoryContext(supabase, profile)                  │
       │  file: apps/app/src/lib/agent/memory/compose.ts           │
       │                                                           │
       │  Runs three parallel Supabase queries:                    │
       │                                                           │
       │    SELECT * FROM current_memory                           │
       │      WHERE business_profile_id = <yours>                  │
       │                       ┌── returns semantic facts          │
       │                                                           │
       │    SELECT * FROM approvals                                │
       │      WHERE action = 'approved'                            │
       │      ORDER BY created_at DESC LIMIT 5                     │
       │                       ┌── returns episodic anchors        │
       │                                                           │
       │    SELECT * FROM approvals                                │
       │      WHERE action IN ('rejected','revised')               │
       │      ORDER BY created_at DESC LIMIT 5                     │
       │                       ┌── returns "avoid these" signals   │
       └───────────────────────────────────────────────────────────┘
                              │
                              ▼
       ┌───────────────────────────────────────────────────────────┐
       │  STEP 2 — AUGMENT                                         │
       │  ─────────────────                                        │
       │  renderMemoryForPrompt(memory)                            │
       │  file: apps/app/src/lib/agent/memory/compose.ts           │
       │                                                           │
       │  Formats the rows into a markdown-ish block:              │
       │                                                           │
       │  ═══ BUSINESS MEMORY ═══                                  │
       │                                                           │
       │  ## Profile                                               │
       │  Brand: Cinder & Bean                                     │
       │  Agent name: Brad                                         │
       │                                                           │
       │  ## What the business is                                  │
       │  What they do: Single-origin coffee, slow-roasted...      │
       │  Who it's for: Home coffee drinkers who want quality...   │
       │  Their edge: Eight roasts a year, shipped within 72h...   │
       │                                                           │
       │  ## Style references                                      │
       │  User picked: Boutique, Editorial. Lean every output...   │
       │                                                           │
       │  ## Recently approved (what the brand sounds like)        │
       │  • social_ig: "Roasted Tuesday. In your kitchen by Fri."  │
       │  • landing:   "Eight roasts a year. Eight reasons..."     │
       │                                                           │
       │  ## Recently rejected (avoid these directions)            │
       │  • ad — reason: too corporate, lost the warmth            │
       │                                                           │
       │  ═══ END MEMORY ═══                                       │
       │                                                           │
       │  This block is concatenated onto the surface-specific     │
       │  system prompt (studio prompt in this case) by            │
       │  buildSystemPrompt() in                                   │
       │  apps/app/src/lib/agent/prompts/index.ts                  │
       └───────────────────────────────────────────────────────────┘
                              │
                              ▼
       ┌───────────────────────────────────────────────────────────┐
       │  STEP 3 — GENERATE                                        │
       │  ──────────────────                                       │
       │  anthropic.messages.stream({                              │
       │    model: "claude-sonnet-4-5",                            │
       │    system: <augmented prompt>,                            │
       │    tools: [set_active_deliverable, refine_active, ...]    │
       │    messages: <conversation history + new user turn>       │
       │  })                                                       │
       │                                                           │
       │  Claude reads the memory block and knows:                 │
       │    • It's Brad talking to a coffee brand owner            │
       │    • Style should lean Boutique + Editorial               │
       │    • Past approved headlines tell it the brand's voice    │
       │    • "Too corporate" was a rejection reason — avoid it    │
       │                                                           │
       │  It calls refine_active("make the headline shorter")      │
       │  and confirms in 8 words in Brad's tone.                  │
       └───────────────────────────────────────────────────────────┘
                              │
                              ▼
       Response streams back to ElevenLabs (SSE chunks in OpenAI format)
                              │
                              ▼
       ElevenLabs synthesizes the audio (TTS) and plays it
                              │
                              ▼
       You hear: "Cutting the second line — leaves you with..."
```

The whole loop — retrieve, augment, generate, respond — runs in roughly 1–2 seconds end-to-end.

---

## What's implemented today

| Piece | Status | File |
|---|---|---|
| Schema with `business_profiles`, `memory_entries`, `deliverables`, `approvals`, `voice_sessions` | ✅ Live | Supabase project `dxpuwtorswquwxljpwcj` |
| Multi-tenant isolation via Postgres RLS | ✅ Live | Migration `0001_init_memory_layer` |
| pgvector + HNSW index for similarity recall | ✅ Schema ready (column nullable until embedder ships) | Migration `0001` + `0002` |
| Memory write paths from onboarding (intake + references) | ✅ Live | `app/api/onboarding/*` |
| Semantic memory retrieval (always-inject facts) | ✅ Live | `lib/agent/memory/compose.ts` |
| Episodic memory retrieval (top-N approvals/rejections) | ✅ Live | `lib/agent/memory/compose.ts` |
| Memory rendered into prompt block | ✅ Live | `renderMemoryForPrompt()` |
| Surface-aware system prompts (onboarding vs studio) | ✅ Live | `lib/agent/prompts/` |
| Custom-LLM endpoint streaming Claude in OpenAI format | ✅ Live | `app/api/agent/converse/route.ts` |
| ElevenLabs configured to use the custom-LLM endpoint | 🟡 Phase 4 — pending live API iteration | `scripts/setup-voice-agent.mjs` |
| Wow deliverables persist to `deliverables` table | 🟡 Phase 5 | `app/api/wow/route.ts` |
| Studio screen awareness (active page / deliverable passed per turn) | 🟡 Phase 6 | `lib/agent/onboarding-agent.tsx` + `useAgentContext` hook |
| Approval flow writes back to memory | 🟡 Phase 7 | New hook + writes |
| Post-session signal extraction (likes/dislikes from transcripts) | 🟡 Phase 8 | Supabase Edge Function |
| Vector recall: embeddings on memory_entries + similarity search | 🟡 Phase 8 (with signal extraction) | Edge Function + pgvector |

---

## What's coming next — vector recall

The current retrieval is good but not personalized to the user's *current intent*. We always pull the same semantic block + the most recent 5 approvals. That's fine when memory is small.

Once a heavy user has 200+ approved deliverables, we don't want all 200 in the prompt every turn — that wastes tokens and dilutes signal. We want **the 5 deliverables most semantically similar to what the user is asking about right now**.

This is where vector recall comes in:

```
User: "Make me a Mother's Day Instagram post."
                    │
                    ▼
         Embed the request → [0.13, -0.42, 0.81, ...] (1536 floats)
                    │
                    ▼
         pgvector HNSW search:
         "find the 5 memory_entries whose embedding is
          closest to this one by cosine similarity"
                    │
                    ▼
         Returns: 5 past Instagram posts about seasonal moments
         (Valentine's, Father's Day, Black Friday) — high signal
         for a Mother's Day request
                    │
                    ▼
         Those 5 get injected as episodic context
         instead of "the 5 most recent" — much more relevant
```

We have the schema for this (column `memory_entries.embedding vector(1536)`, HNSW index, query helpers). The missing piece is the **embedder** — a small job that runs after every memory write, generates the vector via OpenAI's `text-embedding-3-small`, and writes it back. That ships with the signal-extraction Edge Function in Phase 8.

---

## TL;DR — the mental model

- **Claude is the smart but amnesiac brain.** Same brain serves every user.
- **Supabase is the long-term memory.** Different memory per user.
- **RAG is the read-out:** every turn, we fetch the relevant memory, hand it to Claude, get a response that sounds like Claude knew you all along.
- **Three flavors of memory** (semantic facts, episodic events, working session state) get retrieved differently but all flow through the same `composeMemoryContext` pipeline.
- **The brief calls this out explicitly** (§5.3): *"Every approved output updates memory — the agent learns the business by doing work for it."* That's RAG, written as a product principle.

If you remember nothing else: **the agent's intelligence is generic; its intelligence about YOUR business is RAG.**

---

## File map (where the pieces live)

```
apps/app/src/
├── lib/
│   ├── supabase/
│   │   ├── memory.ts       # writeMemoryEntry, kinds, sources
│   │   ├── profile.ts      # getActiveBusinessProfile
│   │   ├── server.ts       # Clerk-scoped client (RLS applies)
│   │   ├── service.ts      # service-role client (bypasses RLS)
│   │   └── types.ts        # generated from Supabase schema
│   └── agent/
│       ├── memory/
│       │   └── compose.ts  # composeMemoryContext + renderMemoryForPrompt
│       ├── prompts/
│       │   ├── index.ts    # buildSystemPrompt (surface dispatch)
│       │   ├── onboarding.ts
│       │   └── studio.ts
│       ├── tools/
│       │   └── index.ts    # Anthropic Tool[] schemas by surface
│       └── openai-compat.ts  # Anthropic ↔ OpenAI SSE bridge
└── app/api/
    ├── agent/
    │   └── converse/route.ts  # the custom-LLM endpoint
    └── onboarding/
        ├── business-profile/route.ts  # writes intake memory
        └── references/route.ts        # writes style memory
```

Read these in order and you'll see the whole RAG pipeline end-to-end.
