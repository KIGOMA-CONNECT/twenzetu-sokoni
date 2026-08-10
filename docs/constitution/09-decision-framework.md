# Chapter 9 — Decision Framework

The Decision Framework determines *who* decides *what*, and *how*. Its purpose is speed with accountability — decisions should be made at the level closest to the knowledge, and escalated only when values, vision, or cost are at stake.

## 9.1 Decision levels

| Level | Who decides | Typical decisions |
|---|---|---|
| **L1 — Implementation** | Individual contributor / reviewer | Variable naming, code style, local refactors, test coverage of a function. |
| **L2 — Module/Suite** | Suite maintainers | API design inside a suite, library structure, backlog grooming. |
| **L3 — Platform** | Platform Council | Cross-suite contracts, dependency choices, security posture, maturity level changes, new platforms. |
| **L4 — Constitutional** | Owner + Council | Amendments to this Constitution, Vision, values, or governance. |

Rule: decide at the lowest possible level; escalate when the decision touches another level's authority.

## 9.2 The decision test

Before making a significant decision, answer five questions:

1. **Alignment** — Does this move the platform toward the Vision (Ch2) without violating the Mission (Ch3)?
2. **Values** — Which Core Values (Ch4) does this uphold? Does it trade any away?
3. **Principles** — Which Engineering/Architecture/Product principles (Ch5–7) apply, and how?
4. **Cost** — What is the cost to build, run, and maintain this over 5 years?
5. **Trust** — Does this protect user money, data, and reputation?

If a decision fails any of these without a recorded justification, it is sent back to the proposer.

## 9.3 Decision record format (ADR)

A decision record is short and structured:

```markdown
# ADR-####: <Title>

- Status: Proposed | Accepted | Superseded by ADR-####
- Date: <ISO date>
- Decision maker: <Owner | Council | Suite maintainer>
- Context: <The problem and constraints>
- Options considered: <List with brief pros/cons>
- Decision: <The choice and why>
- Consequences: <What this enables and what it costs>
- Constitution check: <Chapters 2–7 alignment>
```

## 9.4 Conflict resolution

- When principles collide, revisit the Vision: the choice that best serves the 2035 vision and the trust of users wins.
- When people collide, escalate to the Platform Council; the Council's ruling is recorded.
- No one wins a decision by being louder; evidence and records win.

## 9.5 Consent and dissent

- **Consent** means "this is safe to proceed" — not that everyone loves it.
- **Recorded dissent** is encouraged: a dissent with evidence is a gift, not an obstruction.
- A decision that proves wrong is reversed quickly and the reversal is recorded — reversing is not failure; hiding is.

## 9.6 Urgent decisions

- In production incidents, the on-call engineer may act first and record after. Action now, accountability always.
- Emergency changes still follow review once the fire is out.
