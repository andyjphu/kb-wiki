---
title: Knowledge consolidation
tags: [memory, proposal]
---
**Status: proposed design.** Consolidation maintains a useful, compact knowledge layer while preserving the evidence beneath it.

## Different changes need different operations

| Situation | Proposed treatment |
| --- | --- |
| Two entries repeat the same fact | Merge them and retain both source references. |
| New evidence explicitly replaces a fact | Mark the old fact as superseded and link the replacement. |
| Two sources disagree | Preserve the disagreement until its scope or factual conflict is resolved. |
| A task has finished | Archive its temporary state outside ordinary active retrieval. |
| Several cases support a reusable procedure | Distill the procedure, its conditions, and its exceptions. |

## Keep the source

A summary is an interpretation. The original [[evidence-and-history|evidence and history]] lets a reviewer check what was lost or inferred.

Repeated whole-document rewriting can erase useful qualifications. Small, versioned edits make the changes easier to inspect. [[../research/memory-research|ACE and related research]] motivate this approach.

## Outdated does not mean old

A long-standing instruction may still govern current work. A recent observation may already be obsolete. Retirement should follow a replacement, changed circumstances, or demonstrated invalidity rather than age alone.

See [[../examples/revising-a-fact|Revising a fact]] for an illustrative example.

## Application to agents

Keep enduring role instructions in [[../agents/specialist-profiles|specialist profiles]]. Retrieve detailed knowledge as needed, and keep current task state separately.
