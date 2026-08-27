# UI Surface Design Philosophy

*Companion to the UI Surface Design Specification. The specification names
every screen and every action; this document names the discipline the
screens must honour. Read before Phase D sprint 053 (canvas established,
vocabulary loaded). Reread before each sub-phase closes.*

## 0. What this philosophy is for

The build is a manufacturing execution and record system for complex
hardware. Aerospace parts. Serialised inventory. Governed procedures.
Real dispositions. The operator on the shop floor decides, in the moment,
what physically happens to the part in their hand. The record their
click writes is what the auditor reads six months later.

This is not B2B SaaS. The default design vocabulary of the modern web —
generous whitespace, thin fonts, subtle greys, delight animations,
onboarding first-look — was tuned for reading landing pages in an office
with two coffees. It is the wrong default for a factory floor, and it is
the pull the `design` skill will exert if left ungoverned.

The philosophy that governs Phase D draws instead from six older
traditions that already survived the argument this domain forces:
high-performance HMI, alarm management, poka-yoke, classical human
factors, situation awareness, and aviation cockpit design.

## 1. Six constraints that shape every design decision

Every principle below assumes these six conditions hold on this build's
users. When they don't, the principle may relax. When they do, it does not.

**Interruption is the normal state, not the exception.** An operator is
called across the floor, gets a phone message, hits a jam, walks to the
tool crib, or hands off to a co-worker mid-step. The UI must survive that
without losing the operator's place. This constraint is not softened by
"design for focus" — focus is a luxury; recovery is a requirement.

**Hands and eyes are not fully available.** Gloves are common; the screen
is often oily or dusty; the ambient light varies from morning shift to
evening; the operator may be looking at the part more than the phone.
Small tap targets, thin fonts, low contrast, and hover states fail.

**The consequence of a wrong click is real product harm.** Not "the user
has to click undo". A wrong disposition ships a nonconforming part to a
customer whose satisfaction is not the metric — the customer's aircraft
is. The UI's job is not to be forgiving on the wrong action. It is to
make the correct action the obvious one and the wrong action require
effort or authority.

**The workforce turns over.** Skilled floor personnel are scarce and
seniority varies. A screen a new operator cannot use on their first day
without a supervisor is a screen that costs the factory a shift.

**The device may be shared.** Two operators, two shifts, one tablet. The
UI must show whose session is active, whose caller identity is bound,
and whose action is next; and the session must be recoverable if the
device changes hands mid-task.

**The user is skilled at the physical task, not the software.** The
UI is not the product. The part is. The UI's authority extends to the
part only through the operator's willingness to use it, and that
willingness is renegotiated every shift. Screens that ask the user to
learn the software's model of the domain lose. Screens that show the
operator's model of the domain — the run, the step, the measurement,
the part in front of them — win.

## 2. Six traditions the philosophy draws from

Each tradition has published standards, canonical books, and decades of
practice behind it. The philosophy inherits from all six.

**High-performance HMI.** ISA-101 *Human-Machine Interfaces for Process
Automation Systems* (2015). Hollifield, *The High Performance HMI
Handbook* (PAS, 2008). The ASM Consortium's *Effective Console Operator
HMI Design* (Honeywell / ASM Consortium research, 2009 onwards). The
central claim: process operators looking at legacy DCS screens see
colour used everywhere and can no longer tell what needs attention.
The corrected default: grey ground, monochrome text, colour only where
action is required.

**Alarm management.** ANSI/ISA-18.2 *Management of Alarm Systems for
the Process Industries* (2016). EEMUA-191 *Alarm Systems: A Guide to
Design, Management and Procurement* (UK, 3rd ed. 2013). Every alarm
has a defined cause, a required response, and a time to respond. An
operator who cannot act on an alarm should not receive it. Alarm floods
(more than 10 alarms per 10 minutes per operator) are a system failure,
not an operator failure.

**Poka-yoke.** Shigeo Shingo's *Zero Quality Control: Source Inspection
and the Poka-Yoke System* (Toyota Production System, 1986 English
translation). Mistake-proofing: design the process so the wrong action
becomes physically impossible or produces an unmistakable signal
before harm compounds. The build already invokes poka-yoke at the code
level (schema validated at the speaker's mouth; every guard fail-closed).
The UI invokes it at the interaction level.

**Classical human factors.** Norman, *The Design of Everyday Things*
(1988, revised 2013) — affordances, signifiers, mapping, feedback,
constraints. Nielsen's ten usability heuristics (1994) and latency
thresholds (Nielsen 1993, still cited). Reason, *Human Error* (1990) —
the slip / lapse / mistake / violation taxonomy; the Swiss-cheese model
of accident causation.

**Situation awareness.** Endsley, *Toward a Theory of Situation Awareness
in Dynamic Systems* (Human Factors, 1995). Three levels: perception of
the elements in the environment, comprehension of their meaning,
projection of their status into the near future. A screen that shows
only current state without change history denies level 3.

**Aviation cockpit design.** *Dark cockpit* principle: the cockpit is
dark under normal operation; a light comes on only when the pilot needs
to know something. *Sterile cockpit* rule (FAR 121.542, US federal
regulation for airline crews): during critical phases of flight, no
non-essential conversation or activity. Both principles translate to
factory UI: normal-state screens show the minimum; critical actions
suppress non-essential UI.

**Signal-Driven Development.** `dev/sdd-kit-2/foundations/01-signal-driven-development.md`;
`grammar/PRINCIPLES.md`; the working agreement at `dev/sdd-kit-2/AGENTS.md`.
The methodology this project already runs under. Its central claim: the
description step between what the program knows and what the reader
reads is the lossy step. Replace description with typed signals — stable
tags, categorised, with a fixed payload — so the program speaks its
state directly rather than through a paraphrase. Applied to UI, the
claim generalises. The description step between what the record holds
and what the operator sees is also lossy; replace it with the same
vocabulary, the same states, the same registered names the code speaks.
The UI is not a translator. It is a projection of the domain grammar
into the visible world.

## 3. Seventeen principles

Twelve from the six older traditions; five more (3.13 through 3.17)
from the Signal-Driven Development canon. Each names its source,
states its rule, and applies to this build.

### 3.1 Grey is the ground; colour is exception

*Source: ISA-101, Hollifield 2008, ASM Consortium research.*

The base palette is monochrome grey. Colour, motion, and audible tone
are reserved for what needs the operator's action. Text is black on
grey. State badges use one saturated colour per exception category
(red for refusal, amber for pending action, blue for informational).
Anything neutral stays greyscale.

*In this build:* the token artboards for handheld and Mac (Phase D
sprint 054) declare the greyscale ground first, then the exception
palette. The runtime-action-state library (sprint 055) uses colour only
on `operation_failed`, `report_stale`, `projection_stale`, and
`network_unavailable`. The scan-classification patterns (spec §10) show
`identity_only` in monochrome; `presence_asserting` handoff-E rows
carry the exception amber.

### 3.2 Every state is named; nothing is inferred

*Source: ISA-101; NUREG-0700 (US Nuclear Regulatory Commission Human
System Interface Design Review Guidelines).*

A visible object has a visible state label. `Run` is `in_progress` or
`blocked` or `close_check` — never "we're doing stuff". `Certificate`
is `captured` or `verified` or `rejected` — never "the paperwork is
being sorted". `RunCloseCheck` names its blockers by registered rule
id (`failed_measurement_has_quality_path`), not by paraphrase.

*In this build:* every state name the artboard shows resolves in
`contracts/state-machines.yaml`, and the spec's §4.1 table of sixteen
records-with-lifecycle is the operator's ground truth. A state the
registry does not name does not appear on the artboard.

### 3.3 Every action names its consequence

*Source: Norman on signifiers; Nielsen heuristic 4 (consistency and
standards).*

A button says what happens, in the vocabulary the code speaks.
"Complete step" not "Done". "Accept as evidence" not "Approve". Where
the action is irreversible, the button also names what cannot be
undone. Where the action fires a system-worker pipeline, the button
names the pipeline, not the first stage — "Attempt close" walks
through four registered operations; the operator reads "Attempt
close" and sees the four stages named on the readiness console (spec
§17.1).

### 3.4 The correct action is the easy one; the wrong action requires effort

*Source: Poka-yoke (Shingo); Norman on constraints; ANSI/ISA-18.2 on
consequence-graded alarms.*

Fail-closed at the UI level, matching the code. A button whose
registered rule refuses under the current caller is disabled with the
reason named. A disposition kind gated on `elevated_disposition_authority`
is greyed for the operator who lacks it, and the reason cites the rule.
`ReleaseFromQuarantine` refuses at the code level unless a fresh
`ReceivingCheck` passes; the UI matches — the button is disabled and
the disabled-state strip names the missing check.

Elevated actions get an intermediate confirmation, not a modal that
races the operator. `use_as_is` and `repair` dispositions require the
elevated authority AND an explicit reason field. `SupersedeReport`
requires a supersession trigger name, not a free-text nudge. Every
irreversible act carries a confirmation that names the record and the
state transition, and shows the caller who signed for it.

### 3.5 Progressive disclosure of complexity

*Source: Nielsen heuristic 8 (aesthetic and minimalist design), aviation
dark-cockpit, Wickens on attention.*

Show what the current caller needs on this screen. Everything else is
one hop away, and each hop is bounded (the spec's `BoundedDrillDown`
is the code shape for this). A run step shows the step's instruction,
its required measurements, and its current blocker — not the run's
audit trail, not the procedure version history, not the redline queue.
Those live one hop away.

### 3.6 Feedback within human thresholds

*Source: Nielsen 1993 latency thresholds; Card, Robertson & Mackinlay
1991 on information visualisation response times.*

- 0.1 s: feels instantaneous. `operation_pending` must appear within
  this window after the tap.
- 1 s: the operator notices the delay but keeps their flow of thought.
  `operation_succeeded` or `operation_failed` should arrive here on
  the happy path.
- 10 s: the operator's attention drifts. Anything longer becomes a
  background job with its own state, its own progress indicator, and
  its own return path.

*In this build:* the runtime-action-state library (sprint 055) draws
`loading`, `operation_pending`, `operation_succeeded`, and
`operation_failed` explicitly, with the threshold each state serves.
Report generation is a system-worker pipeline; the close console
shows every stage rather than pretending one long spinner covers
what the code is doing across four operations.

### 3.7 Every screen is recoverable

*Source: Reason 1990 slip / lapse taxonomy; Norman on system-state
feedback.*

An operator interrupted mid-measurement returns to a screen that names
where they were and what they were doing. No modal that eats state.
No "session expired, start over". The Profile screen (spec §11.5)
carries the current caller identity, the active run, the current step,
and the last completed action, so a returning operator or a new-shift
operator reads their situation without menu-hunting.

A single-tap escape hatch — "back to my work" — is available on every
handheld screen and is anchored to the operator's active run.

### 3.8 Tap targets fit gloved hands; contrast survives glare

*Source: Fitts's Law; ISA-101 handheld guidance; WCAG 2.2 AAA
contrast; Apple HIG (minimum 44×44pt) and Google Material (minimum
48 dp) baselines.*

Handheld primary tap targets are 15 mm physical minimum, 20 mm
recommended (Fitts's Law + industrial ergonomics). Text on the shop
floor uses WCAG AAA contrast (7:1 for body, 4.5:1 for large text)
as a floor, not a ceiling. Fonts are geometric sans, medium weight
minimum; thin weights are forbidden on the shop-floor handheld. No
hover state. No pointer-precision affordance.

Where two adjacent controls have different consequences (Accept vs
Reject; Install vs Reject scan), they are separated by a spacer no
smaller than one tap target, so an accidental thumb slide cannot
change the meaning of the action.

### 3.9 Alarms are ranked and rare

*Source: ANSI/ISA-18.2; EEMUA-191.*

Every alarm has a distinct cause, a required response, a defined time
to respond, and a caller who acts on it. Alarms are consequence-graded
into three levels at most (informational, actionable, critical), with
one saturated colour per level. Alarm floods indicate the system, not
the operator, has failed.

*In this build:* a blocker view (spec §7) shows at most one top blocker
with the full row shape and lists the remainder as a compact secondary
list. The QualityQueue projection (`contracts/projections.yaml`) drives
the Mac queue view; it does not push floods to the handheld. Runtime
incidents (`RUN_BLOCKED`, `MEASUREMENT_FAILED`, `RECEIVING_CHECK_BLOCKED`)
carry into the operator's alarm strip only when the operator is the
next actor.

### 3.10 Situation awareness at three levels

*Source: Endsley 1995.*

Level 1 (perception): what is the state now. Every screen answers
this in its top strip.

Level 2 (comprehension): what does this state mean for the operator's
current task. Every screen answers this in the primary action label
and the enabled/disabled reasons.

Level 3 (projection): what happens next if I do nothing, or if I do
the next action. The run-close readiness console names every rule
and its projection: pass, fail, not-applicable. The receiving check
view names the rules and what each release refuses on. Level 3 is
the level most B2B UIs skip; this build's UI does not.

### 3.11 The philosophy inherits the code's discipline

The registries are the vocabulary; the UI shows the same words. The
state machine is the ground truth for allowed transitions; the UI does
not offer buttons the state machine forbids. The receiving-rule and
run-close-rule registries name the reasons; the UI reads those
descriptions verbatim. The authorization rules name who may act; the
UI's enabled and disabled states reflect them.

Poka-yoke at the code level (schema validated at the speaker's mouth;
every guard fail-closed) is mirrored by poka-yoke at the interaction
level (buttons disabled with named cause; adjacent controls spaced;
irreversible actions confirmed with the specific record named).

### 3.13 The vocabulary is the interface

*Source: SDD foundation 01; grammar/PRINCIPLES.md commitment 1; the
project's own no-invention rule.*

The registered names on the artboard are the operator's language, not a
translation of it. `quarantined` does not soften to "on hold". `close_check`
does not soften to "wrapping up". `disposition_pending` does not soften
to "under review". The vocabulary was authored at the founding act with
the domain in mind; the UI inherits that authoring. A paraphrase for
"friendliness" trades stability for warmth, and the trade fails on hour
six of a night shift when the operator matches the screen against the
part in front of them and finds the two use different words.

*In this build:* every state, reason code, blocker id, visibility label,
and event name the artboard renders comes verbatim from `contracts/*.yaml`.
Downstream systems (printed procedure cards, audit reports, machine
adapter payloads) already carry the registered names. The UI is the last
surface where a paraphrase could sneak in; the philosophy forbids it.

### 3.14 Halt-and-articulate at design time

*Source: SDD hard rule 4 (`dev/sdd-kit-2/AGENTS.md`).*

When the vocabulary cannot express what a screen needs to show, halt.
Do not invent UI to paper over a code gap. The design specification's
§9 handoff rows are the code shape for this — `handoff-E` and
`handoff-F` mark vocabulary gaps to future boundaries. At design time,
the equivalent halt reason is `design_pattern_missing`: the design
skill cannot render a pattern the philosophy requires because the
vocabulary does not exist yet. The sprint halts, the reason surfaces
to `dev/BLACKBOARD.md ## Surfaced for review`, and the Architect
resolves via `## Decisions`. No sprint closes a screen by inventing a
name.

### 3.15 Comprehension affirmation before authoring

*Source: SDD hard rule 5 and `dev/sdd-kit-2/AGENTS.md § COMPREHENSION_AFFIRMATION`.*

Before the design skill draws an artboard, the sprint opens with a
paragraph in the sprint's own words: what this screen is for, which
caller uses it, what registered names it will cite, what refuses, and
which of the three tests in §6 will grade it. The paragraph is not a
ritual. It performs two mechanical functions the SDD kit already
documents: intermediate tokens the model computes over (serial-compute
depth), and attendable in-window state the subsequent authoring is
conditioned on (in-window priming). A hollow paragraph primes for
nothing project-specific; the Architect refuses it. A grounded
paragraph makes the artboard that follows honest to this screen, this
caller, this scenario.

### 3.16 Show state, do not narrate

*Source: SDD foundation 01, the deep claim.*

Description is the lossy step. The artboard shows state; it does not
prose over the state. A screen that says "You can now proceed to the
next step" is narrating what a step-state badge already carries. A
screen that says "The certificate has been accepted" is narrating what
the Certificate state (`verified`) already reveals. Drop the narration;
keep the state. Where an actor must be told something the state cannot
carry (a required-next-actor label; a caller's context; a scope), the
label is short, factual, in the registered vocabulary, and never
addressed to the reader in the second person.

The pull the `design` skill exerts here is strong. LLM-authored copy
defaults to instructive, warm, second-person, and complete. The
philosophy holds against all four defaults.

### 3.17 The Rubber Duck Pass applies at design time

*Source: `dev/sdd-kit-2/AGENTS.md § Sprint close: the Rubber Duck Pass`.*

Every artboard passes a three-question walk before it closes:

1. What does the caller need to see on this screen?
2. What does the caller need to do?
3. What refuses, and by what registered reason?

An artboard that cannot answer one of the three is not closed. Any
category — missing pair, order violation, vocabulary gap, payload
anomaly, timing surprise, tone trace — surfaces to `dev/BLACKBOARD.md
## Surfaced for review` with a typed disposition, exactly as the
Rubber Duck Pass names it at code-level.

## 4. What the philosophy does not do

Stated explicitly so the pull it works against is legible.

- **It does not chase the modern B2B SaaS aesthetic.** No hero
  gradients. No card shadows for their own sake. No neutral pastels.
  No emoji. No delight animations. The floor is not the demo.

- **It does not optimise for the first-look.** A screen that impresses
  a stakeholder at a walkthrough but confuses an operator on hour six
  of a night shift has failed. The optimisation target is the tenth
  interaction, not the first.

- **It does not hide state to reduce clutter.** Progressive disclosure
  is bounded, not deceptive. A hidden state is a state the operator
  cannot check.

- **It does not delight through animation.** Motion is reserved for
  attention direction (a new alarm on the top strip) and never applied
  to soothe or reward.

- **It does not treat the user as adversarial.** The operator is not
  trying to break the system. They are trying to build the part. The
  UI's job is not defence; it is clarity.

- **It does not decorate.** Every element on the artboard earns its
  place. If cutting it does not lose information, it goes.

## 5. How the philosophy maps onto Phase D

Each Phase D sprint consumes one or more principles. The mapping is
recorded here so the sprints can be graded against it.

| Sprint | Principles it exercises |
|---|---|
| 053 (canvas + vocabulary) | 3.2, 3.11, 3.13, 3.15 |
| 054 (tokens + shared components) | 3.1, 3.8 |
| 055 (runtime action states) | 3.3, 3.6, 3.16 |
| 056 (empty and no-authority states) | 3.2, 3.4, 3.10, 3.13 |
| 057 (blocker library) | 3.4, 3.9, 3.10, 3.13, 3.16 |
| 058-065 (handheld pack) | all seventeen; 3.5, 3.7, 3.8, 3.13, 3.16 emphasised |
| 066-072 (receiving pack) | 3.2, 3.3, 3.4, 3.9, 3.11, 3.13, 3.14 emphasised |
| 073-077 (quality pack) | 3.3, 3.4, 3.9, 3.10, 3.13 emphasised |
| 078-082 (access and reports pack) | 3.2, 3.5, 3.10, 3.13, 3.16 emphasised |
| 083-086 (flow assembly) | 3.5, 3.7, 3.10 emphasised |
| 087 (handoff bundle) | 3.11, 3.13 emphasised — the bundle must preserve every discipline the artboards honoured, in the registered vocabulary |
| 088 (acceptance closeout) | 3.17 emphasised — the Rubber Duck Pass runs one last time across the pack |

## 6. Three tests every screen must pass

Before an artboard closes, the sprint's Rubber Duck Pass asks the three
questions from §3.17 and these three tests.

1. **Recovery test.** An operator interrupted mid-action returns to
   the screen. Do they know where they are and what to do next?
2. **New-shift test.** An operator new to the shift, with no software
   onboarding, uses the screen. Do they do the correct thing on the
   first try?
3. **Glove-and-glare test.** An operator wearing gloves, on a screen
   with reflected light, does the correct thing on the first try
   without hitting an adjacent control.

An artboard that fails any of the three is amended in place; if the
failure is structural, the sprint halts and surfaces to
`dev/BLACKBOARD.md ## Surfaced for review`.

## 7. What this philosophy is not a replacement for

This philosophy sits alongside the UI Surface Design Specification. The
specification names what the UI must draw; the philosophy names how the
UI must feel and behave. Where the two conflict, the specification wins
on registered names and state semantics, and the philosophy wins on
layout, colour, contrast, latency, and interaction discipline.

Two later boundaries will produce their own philosophy notes when they
open: Physical Presence (spec §22) will add a scanner-and-station
philosophy for identity-and-presence disambiguation; Part / Inspection
Requirement (spec §23) will add a versioned-requirements philosophy
for revision-and-scope disambiguation. Both inherit this document.

*End of the UI Surface Design Philosophy.*
