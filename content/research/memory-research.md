---
title: Memory research
tags: [research]
---
Research pointers from the November 20, 2026 discussion. This is a compact reading list, not a claim that one system is best at every task.

## Learning from experience

- [ReasoningBank](https://arxiv.org/html/2509.25140v1): extract reusable strategies from successful and failed trajectories.
- [GEPA](https://arxiv.org/html/2507.19457v1): use trace feedback to propose and evaluate prompt revisions.
- [ACE](https://arxiv.org/html/2510.04618v1): maintain an evolving playbook through incremental reflection and curation.

These are relevant to [[../agents/specialist-profiles|specialist profiles]] and [[../memory/knowledge-consolidation|knowledge consolidation]].

## Consolidation and historical access

- [Complementary Curation and Consolidation](https://aclanthology.org/2026.findings-aacl.218.pdf): combine episodic and relational memories, then merge related entries offline.
- [RD-Forget](https://arxiv.org/html/2609.10263v1): preserve source history while controlling which facts influence a current answer; a preprint.
- [Useful Memories Become Faulty When Continuously Updated by LLMs](https://arxiv.org/abs/2605.12978): evidence that repeated consolidation can degrade useful knowledge; a preprint.

The implication for this example KB is to keep [[../memory/evidence-and-history|original evidence]] accessible when a lesson is condensed or replaced.
