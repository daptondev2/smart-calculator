# 01 — Product Context

## Goal

Increase sales by converting cold website traffic into qualified leads. The mechanism: give a merchant a **credible, his-numbers dollar figure** of what they'd save by switching from Stripe to EPD, with low enough friction that suspicion doesn't kill it — then capture them as a lead while intent is hot.

The whole funnel rests on one thing working: **the merchant sees a savings number they trust, on their own real data, before any sales call.**

## Users

### Primary — the Merchant ("Marcus")
- Owner-operator of a mid-size online store. ~$120k/mo card volume, ~4,000 transactions. Currently on Stripe. No finance team — he is finance.
- **Core pain:** he cannot tell, in dollars on his own numbers, whether switching processors actually saves money. Statements bundle everything into one opaque "fees" blob; every vendor quote is a generic teaser rate.
- **What he needs from us:** a trusted dollar figure, fast, low effort (upload one PDF), no account, no sales call first. He is suspicious by default and expects rigged numbers — credibility is everything.
- **JTBD:** *When my monthly Stripe fees eat into every order, I want to see in dollars on my own numbers how much a different gateway saves me, so I can decide if switching is worth it without booking a sales call first.*

### Secondary — the Sales Rep ("Priya")
- Inside sales at EPD. Consumes the captured leads.
- **What she needs:** a pre-qualified row — merchant volume, current fees, computed savings, timestamp, hot/cold flag — so she calls hot leads first and leads with their number instead of cold-educating strangers.
- **JTBD:** *When a merchant runs the calculator and shows real savings, I want their numbers and a hot flag handed to me instantly, so I can call while intent is hot.*

> The frontend serves **Marcus**. Priya is served by the Supabase row the backend writes — **not** by any UI you build.

## Biggest pain the product must solve

> The merchant cannot see, in dollars on his own real numbers, whether switching gateways actually saves money — and the only way to find out today is a sales call that starts with homework he can't do.

Frontend's contribution: collapse that to a **trusted, self-serve, his-numbers dollar figure shown before any human contact**, with friction low enough (one PDF upload) that distrust doesn't end the session. Every UX decision you make is judged against: *does this make the number more credible and the path lower-friction?*

## The honesty principle (non-negotiable)

EPD has real fixed costs Stripe doesn't ($99 setup, $36/mo) and uses interchange-plus pricing. In the MVP these are simplified to a flat 1.5% placeholder. Because of this:

- Some merchants will show **no savings or negative savings**. That is expected and correct.
- When that happens, the UI must say so honestly (e.g. "you're already competitively priced") — never clamp a loss to a fake positive. The lead is still captured, just flagged cold.
- Credibility is the product's entire moat. A number that overpromises and gets contradicted on the sales call destroys it. Design the "no savings" state with as much care as the "you save $7,680" state.

## In scope (MVP)

- Upload one Stripe statement PDF → see annual savings → optionally give email.
- Capture lead + hot/cold flag.

## Out of scope (do NOT build)

Stripe OAuth · multi-processor support · real interchange-plus engine · fixed-fee math (knobs = 0 for now) · sales notifications · saved file storage · user accounts / login · saved history / dashboards · raw statement storage.
