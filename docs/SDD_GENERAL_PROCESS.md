# Signal-Driven Development as a General Process

## How to think about it

Any domain repeats itself across its documents. Ten factory work instructions describe the same steps in different words. The kinds of things, the states they can be in, the moves allowed, and the reasons a move gets refused stay constant. The wording changes.

Signal-Driven Development is a method with two parts:

- Name the things that repeat: the kinds of things, the states they can be in, the moves that are allowed, and the reasons a move gets refused. Usually fewer than a hundred entries. That set of names is the grammar.
- Use the grammar two ways. Build a system that only speaks names in the grammar. Check the domain's own documents against the grammar. Building and checking are the same operation run in opposite directions.
- Everything a built system does has a name in the grammar. Anything the grammar cannot name is either a gap the grammar must add, or a proposal the checker refuses.

The method is old. Law wrote statutes as logic programs in the 1980s (Sergot and Kowalski, on the British Nationality Act). Medicine has decades of computer-interpretable guidelines. Process mining reads process models out of event logs. Program synthesis builds code from specifications. SDD is what those methods look like when the loop runs over plain text, with a language model reading the text, and one list serves both to build and to check.

The rest of this note places SDD against the fields that already do parts of it, and names where the method fails.

---

## 1. Two directions, same grammar

Forward: someone writes the grammar down from what they know, then builds and checks a system against it. Reverse: someone reads the grammar out of an existing body of text, then builds a cleaner system from it. §4 covers the forward direction into rule-bound domains; §5 covers the reverse direction to the point where the method breaks.

The grammar fixes the set of things that count. It yields two operations at once: build things by following the rules, and check things by asking whether they satisfy the rules. The builder can only produce what passes the check; the checker only accepts what the builder can produce. A type does the same job for values in a program.

---

## 2. The borrowed loop

The reverse loop — read a model out of the text, check the text against it, build a cleaner system — is the shared core of five settled fields.

- Process mining (van der Aalst) reads a process model out of event logs, checks the logs against it, repairs it. Same loop; it starts from structured logs, not prose, and stops at a model instead of a running system.
- Specification mining (Ammons, Bodík and Larus 2002; Daikon) learns a state machine or a set of rules from program runs and flags code that breaks them. SDD's "gaps show up as typed proposals, not noise" is this idea, moved from program runs to prose.
- Grammatical inference (Gold 1967; Angluin's L\*, 1987) learns a formal language from examples.
- Model extraction (Tramèr and others, 2016) rebuilds a working copy of a black-box model from its answers. SDD's exact promise, missing one thing SDD lacks: a live oracle you can keep asking.
- Model-driven reverse engineering (OMG ADM and KDM) recovers a model from old code and builds a cleaner system from it. The field whose goal matches SDD's most closely.

The forward direction is also old: model-driven engineering plus program synthesis. The one odd move — that the spec is locked and also serves as the check — model-driven engineering's metamodels already make.

The new parts are worth naming: running this loop over plain text with a language model as the reader; using repetition across the text to correct errors; the two-source move in §4; and the reach test in §3. None escapes two old limits.

- Gold (1967): you cannot pin down a rich language from positive examples alone. Public text is almost all positive examples. The rules and the forbidden moves — the part of a grammar worth locking — are what positive text cannot fix.
- Angluin (1987): learning a machine fast needs a teacher who answers both "is this in the language?" and "is my whole guess right?" A body of text answers neither. SDD supplies the teacher through its tests, its human review, and in law the judge. The bet depends on that teacher; name the teacher or the bet looks stronger than it is.

---

## 3. The reach test

SDD works when the grammar can express the important behavior of a domain. It fails when the important behavior cannot fit in the grammar.

Two formal statements say the same thing. By minimum description length, the best grammar makes "the grammar plus the text given the grammar" shortest to write down; whatever will not shrink is the cruft. By rate-distortion theory (Shannon; Tishby, Pereira and Bialek 1999), the grammar is a compact code that keeps the useful part of the text; what it drops is the loss.

Rate-distortion assumes you already know which losses count, and no fixed rule picks that. Choosing a grammar is choosing what counts as loss. The grammar declares what is cruft and cannot prove, from inside itself, that the cruft was worthless. Two more limits agree. Kolmogorov says a short grammar need not exist at all, and no method can tell you in advance whether one does. No-Free-Lunch (Wolpert and Macready 1997) says any method that does well on rule-shaped domains does exactly as badly on the others.

The reach test is a testable bet, not a proof. The test is one question: does a locked grammar reproduce the behavior we care about? It explains results better than it predicts them, because you learn which case you were in after you build. §5 names the four ways it can fail.

---

## 4. Reach one: rule-bound domains

Where the bet holds best, SDD renames the most and invents the least. Forty years of separate proof is the best sign the operation is real.

### Law

The claim that a small typed grammar — allowed, required, forbidden, plus moves and ranked exceptions — sits under the words of a statute is the field's founding result. Sergot, Kowalski and others showed it in 1986, writing the British Nationality Act as a logic program. Bench-Capon and Coenen made it a design rule in 1992: one provision, one rule, so the code stays tied to the text as the law changes. Forward SDD runs inside government as Rules as Code (OECD, New Zealand, France, New South Wales) — drafters and coders ship a machine-readable version next to the enacted text. The check works: writing French family-benefit law in Catala (Merigoux and others) turned up a real bug in the government's own code.

The new move is narrow. Today's language-model formalizers take one statute at a time, with a person checking each. They do not yet do the reverse move that matters — reading one shared grammar out of the repetition across a whole body of law, and judging success as "same behavior minus the cruft" rather than line-by-line copying.

Two limits. The wins cluster in tax, benefits, and nationality — the clear-cut, low-discretion corners. Do not extend them to contract, tort, or family law. And code is not law: only the enacted words carry force, so a clean rebuild cannot replace the statute; at best it advises. Much of what looks like the statute's cruft is vagueness put there on purpose, to win agreement and leave hard cases to the courts. Clean it out and you break what the text is for.

### Clinical guidelines

Medicine has done forward SDD for thirty years under another name — computer-interpretable guidelines. GLIF and HL7's CPG-on-FHIR run "plain guideline, then a checked formal version, then a system that acts on it" in production. The field even named SDD's premise (written guidelines carry hidden assumptions, gaps, and contradictions because people wrote them for people) and answered it by writing the plain and formal versions side by side. SDD renames this.

### Government decisions

Two bodies of text, not one. Policy — statute, rule, guidance. Decisions — rulings and outcomes. Existing fields use one or the other. Rules as Code takes the policy and assumes the statute is the real rule, so it is blind to discretion and to practice that has drifted from the written guidance. Judgment prediction (Aletras on the European Court; Katz on the US Supreme Court) takes the decisions but returns a black box, not a rule you can read, and its own field warns that the accuracy often rides on surface cues like which judge sat.

No existing field reads the real working rule out of both at once, or shows where policy and practice differ as one plain, checkable grammar comparable against the statute. That is new, built from known parts, and so far proposed rather than shown. Two dangers: a rule read out of an agency's decisions can make that agency's wrongdoing look like the law; a rule read from outcomes is not tied to the statute's text, so lawyers may reject it however well it predicts.

---

## 5. Reach two: the limit

Push the method until the bet fails. Four separate lines of work put the failure in the same place.

- Polanyi (1966): we know more than we can tell. Some skill was never put into words, so it never entered the text. Repetition across the text has nothing to correct against.
- Moravec (1988): the hardest skills to copy are the oldest bodily ones — walking, catching, picking an odd object off a cluttered shelf. Not the kind of thing a typed grammar can hold at all.
- Dreyfus (1972): a beginner follows rules, an expert has left them behind. The rules you can pull out are the beginner's; the expert's skill is what remains after you subtract them.
- The formal version — rate-distortion, Kolmogorov, No-Free-Lunch — agrees. "The leftover is cruft" is a choice built into the grammar, not a fact the grammar can prove.

The clearest evidence is the collapse of expert systems in the 1980s. Forward SDD, tried at scale: pull an expert's rules out, build a system that obeys them. Feigenbaum named the pulling-out the bottleneck. It took seventy to eighty percent of project time, and about sixty percent of projects failed. Worked where real rules existed (MYCIN, XCON); failed on open judgment.

Every rich domain has two layers: a teachable layer written in a manual and checked for compliance, and an apprentice layer learned by doing under a master and never told. SDD reaches as far as teaching reaches and stops where apprenticeship begins. The same split runs through medicine (protocol against bedside read), law (Hart's settled core against the open edge), and cooking (technique against taste), at different depths. Writing things down can push the split outward by catching patterns experts never named; it never closes.

Four questions for a new domain, before spending anything:

1. Was the valued skill ever put into words at all? If not, there is nothing to read.
2. Is it the kind of thing a typed grammar can hold, or is it a smooth bodily knack?
3. Is being an expert here a matter of leaving the rules behind? Then reading the rules takes the wrong layer.
4. Does writing the grammar quietly rule the valued part out as noise, on a call the grammar cannot check?

The answers are things to test. You cannot compute the limit's place ahead of time.

---

## 6. The real danger: quiet success

SDD fails when success on the teachable layer gets mistaken for covering the whole domain. The rule "nothing counts unless the grammar can say it" is right for a compliance floor and wrong as a picture of what the domain is worth.

- Some cruft matters. In law the vague wording is often on purpose; clean it out and you break the text's work. In medicine the part it drops holds the rare, dangerous case. "Cleaner" can mean "quietly dropped a warning that kills once a year."
- The measure replaces the judgment. Lock the grammar as the only check and the part it cannot say drops out of view: cookbook medicine, judgment left out because no one typed it.
- A rule read from an agency's decisions can make a wrong practice look lawful.
- The repetition that corrects errors corrects only independent errors. One press release copied a thousand times, or many models trained on the same text, agree for reasons that have nothing to do with truth. Models that agree measure faithfulness to the record, not to the world; checking a rebuild with the same models that built it proves nothing. To test truth you need a source outside the text — the oracle problem (Barr, Harman and others, 2015). You can always check that a system matches the record. You cannot, from the record alone, check that it matches the world.

---

## 7. Honest scope

What SDD is: one operation — lock a small typed grammar that both builds and checks a domain, over a body of text that is a repeated, imperfect copy of it. Proven reach into rule-bound domains, run either way.

What is new, in full:

1. Running the read-check-build loop over plain text with a language model as the reader.
2. The two-source move — a readable rule pulled from policy and decisions together, comparable against the statute. Proposed, not shown.
3. The reach test as an explicit, portable, provision-by-provision yes-or-no.
4. Treating the choice of grammar as an explicit, versioned choice of what counts as loss — worth doing only alongside the admission that the choice can be wrong.

What it is not: a new theory of learning, an escape from Gold and Angluin, a solved join of ontology-learning and process-mining (that join is an open problem, not a part importable off the shelf), or the discovery of the limit. The limit is Polanyi, Dreyfus, Moravec, and the expert-systems collapse; SDD gives it a shared name, not a finding.

Point SDD where the worth sits in the rules and the withheld part is cruft — compliance, regulated process, behavior firms already publish — and it is sound. Point it where the worth sits in the leftover — bedside judgment, hard cases, taste, choice under true novelty — and it will reproduce the outline and miss the substance, quietly unless you watch for it.

---

## 8. What is borrowed and what is new

Every central claim, checked. *Rename* means it renames an existing field. *New framing* means a clarifying reframing of a known technique, with the substance mostly old. *New* means a move no single field makes.

| Claim | Verdict | Because |
|---|---|---|
| The reverse loop (read, check, rebuild cleaner) is a new general method | Rename | The shared core of process mining, spec mining, grammatical inference, protocol reverse engineering, and model extraction. Only the words are fresh. |
| Forward SDD (write grammar, build, check) is a distinct method | Rename | Model-driven engineering and program synthesis; Rules as Code; GLIF and CPG-on-FHIR. |
| A small typed grammar sits under law's words | Rename | The isomorphism result (Sergot and Kowalski, 1986; Bench-Capon and Coenen, 1992); Catala. A founding result, not a guess. |
| The limit is where reading the rules fails | Rename | Polanyi, Dreyfus, Moravec, and the expert-systems collapse; Hart's open texture; Sackett's medicine. |
| One grammar joins thing-, move-, and rule-reading and serves as both builder and checker | New framing | A clarifying join, but combining a read ontology with a read process model is an open problem, not a built part. |
| The reach test (worth in structure, or in leftover) | New framing | The math is old; the portable yes-or-no is the note's best synthesis, but untestable until you fix what counts as loss. |
| Running the loop over plain text with a language model | New | Process mining wants structured logs; ontology learning works one document at a time. A real, model-enabled shift. |
| Two-source move: pull the working rule from policy and decisions together, comparable against the statute | New | Neither Rules as Code (policy only) nor judgment prediction (decisions only, black box) fills this gap. |
| Repetition in the text corrects the grammar's errors | New framing | A figure of speech with no channel behind it; it fails on copied repetition. A metaphor sold as a mechanism. |

---

## Sources

**Method and limits**
- Gold, *Language Identification in the Limit* (1967) — https://en.wikipedia.org/wiki/Language_identification_in_the_limit
- Angluin, *Learning Regular Sets from Queries and Counterexamples* (1987) — https://omereingold.wordpress.com/wp-content/uploads/2017/06/angluin87.pdf
- van der Aalst, *Process Mining: Discovery, Conformance and Enhancement* — https://link.springer.com/book/10.1007/978-3-642-19345-3
- Ammons, Bodík and Larus, *Mining Specifications* (2002) — https://dl.acm.org/doi/10.1145/503272.503275
- Ernst and others, *Daikon* — https://www.researchgate.net/publication/222412498
- Tramèr and others, *Stealing Machine Learning Models via Prediction APIs* (2016) — https://arxiv.org/abs/1609.02943
- OMG ADM / KDM (ISO/IEC 19506) — https://en.wikipedia.org/wiki/Knowledge_Discovery_Metamodel
- Gulwani, program synthesis / FlashFill (2011) — https://en.wikipedia.org/wiki/Program_synthesis
- Barr, Harman, McMinn, Shahbaz and Yoo, *The Oracle Problem in Software Testing* (2015) — http://www0.cs.ucl.ac.uk/staff/m.harman/tse-oracle.pdf
- Tishby, Pereira and Bialek, *The Information Bottleneck Method* (1999) — https://www.princeton.edu/~wbialek/our_papers/tishby+al_99.pdf
- Kolmogorov complexity — https://en.wikipedia.org/wiki/Kolmogorov_complexity
- Wolpert and Macready, *No Free Lunch Theorems* (1997) — https://en.wikipedia.org/wiki/No_free_lunch_theorem

**Law**
- Sergot, Sadri, Kowalski and others, *The British Nationality Act as a Logic Program* (1986) — https://dl.acm.org/doi/10.1145/5689.5920
- Bench-Capon and Coenen, *Isomorphism and legal knowledge based systems* (1992) — https://link.springer.com/article/10.1007/BF00118479
- Merigoux and others, *Catala* — https://arxiv.org/pdf/2103.03198 ; deployment — https://www.inria.fr/en/catala-software-dgfip-cnaf
- OECD, *Cracking the Code* (Rules as Code) — https://oecd-opsi.org/publications/cracking-the-code/
- Hart, *The Concept of Law*, ch. 7 (open texture) — https://scholarship.law.bu.edu/cgi/viewcontent.cgi?article=3892&context=faculty_scholarship
- Aletras and others, European Court prediction — https://link.springer.com/article/10.1007/s10506-019-09255-y ; Medvedeva and others, *Rethinking the field* — https://link.springer.com/article/10.1007/s10506-021-09306-3

**Clinical and government decisions**
- GLIF3, computer-interpretable guidelines — https://pmc.ncbi.nlm.nih.gov/articles/PMC2858861/
- HL7 CPG-on-FHIR — https://build.fhir.org/ig/HL7/cqf-recommendations/documentation-approach-06-01-levels-of-knowledge-representation.html
- Rules as Code / OpenFisca — http://logic.stanford.edu/complaw/readings/rules_as_code.pdf ; https://openfisca.org/en/

**The limit**
- Polanyi, *The Tacit Dimension* (1966) — https://www.goodreads.com/book/show/225665.The_Tacit_Dimension
- Feigenbaum, the knowledge-acquisition bottleneck — https://exhibits.stanford.edu/feigenbaum/catalog/sq764cf8300
- Moravec's paradox — https://en.wikipedia.org/wiki/Moravec's_paradox
- Dreyfus, *What Computers Can't Do* (1972); five-stage model (contested — Klein) — https://www.psychologytoday.com/us/blog/seeing-what-others-dont/201711/retiring-the-dreyfus-five-stage-model-expertise
- Knight, *Risk, Uncertainty and Profit* (1921) — https://en.wikipedia.org/wiki/Knightian_uncertainty
- Sackett and others, *Evidence-Based Medicine* (1996) — https://pmc.ncbi.nlm.nih.gov/articles/PMC1475611/

