---
id: DOC-003
type: intake-rules
status: active
phase: null
owner: james
tags: []
links: [DOC-002]
updated: 2026-07-23
---

# Feature intake rules

**The gate a request must pass before it earns a PRD.**

This exists because the expensive failure mode for a solo project isn't building the
wrong thing — it's building the *periphery* well while the core stays thin. The gate
is a speed bump, deliberately.

---

## The five questions

A feature request must answer all five **in writing** before a PRD is opened. An
unanswerable question is itself the answer.

### 1. What problem, for whom?

Name the person and the moment. "Users want filters" is not a problem statement.
"Someone browsing at 6pm on a Friday can't tell which of 40 saved places is open" is.

> ❌ Rejected if: the problem is stated as a missing feature rather than a blocked person.

### 2. Which KPI does it move, and to what target?

Name the metric *and* the number. If the metric isn't currently instrumented, say so —
that's a legitimate answer, and it means instrumentation is part of the cost.

> ❌ Rejected if: no metric, or a metric nobody is measuring and nobody plans to.

### 3. Does it strengthen the core value, or is it periphery?

The core value: **tags applied by many people tell you whether a restaurant fits your
occasion.** Everything else is in service of that or is periphery.

Be honest. Periphery is allowed — but it must be *named* as periphery, so the trade in
question 5 is visible.

> ❌ Rejected if: the answer is "it's core" without an argument for how it makes the
> tag-voting loop better.

### 4. What does it cost — to build *and* to run?

Two numbers, both rough:
- **Build:** sessions of work. Include the clients — an API change is iOS + Android +
  web, and iOS carries App Store review lead time measured in weeks.
- **Run:** per-month infrastructure, per-call API cost, and ongoing maintenance.

> ❌ Rejected if: run cost is unestimated. Recurring costs are how solo projects die quietly.

### 5. What are we deferring to fit it?

Time is fixed. Something moves. Name it.

> ❌ Rejected if: the answer is "nothing" — that means the estimate in question 4 is wrong.

---

## Outcomes

| Outcome | What it means | Next step |
|---|---|---|
| **Pass** | All five answered credibly | Open a PRD in `product/prds/`. It is still not in the launch spec. |
| **Defer** | Real, but not now | Log it in `roadmap.md` with the answers attached. The default outcome. |
| **Decline** | Doesn't strengthen the core, or costs more than it returns | Log it in the roadmap as declined, with the reason. Declined ideas resurface; the reason saves re-litigating. |

**Nothing enters `launch-spec.md` without a PRD that cleared this gate.**

---

## The default answer

For any new feature proposed mid-cycle, the default is:

> **"Not yet — log it in the roadmap."**

Overriding the default is allowed. It requires saying out loud what it displaces.

---

## When to skip the gate

Honest exceptions, so the rule stays credible:

- **Security fixes.** No gate. Fix them.
- **Bugs in shipped features.** No gate — it's already in scope.
- **Anything under ~1 session with no new run cost.** Log it in `todos.md` and do it.

The gate is for *new surface area*, not for maintenance.
