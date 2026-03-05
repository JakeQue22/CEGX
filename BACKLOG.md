# CEGX CRM — Task Backlog

---

## AI Agent Instructions

> **READ THIS FIRST — before doing anything else.**
>
> You are an AI coding agent working on the CEGX CRM repository. Follow these rules
> strictly every time you start a session or receive a new user message:
>
> ### On session start
> 1. Read this entire `BACKLOG.md` file.
> 2. Print the **full task list** — every item under **Completed**, **In Progress**, and
>    **Backlog** — so both you and the user share the same understanding of what has been
>    done and what remains.
> 3. Confirm which task(s) you will work on in this session before writing any code.
>
> ### When the user posts a new comment or request mid-session
> 1. **Check relevance.** Is the comment a correction, clarification, or blocker for the
>    task you are currently working on?
>    - **Yes → address it immediately** as part of the current task.
>    - **No → append it** as a new bullet at the bottom of the **Backlog** section below,
>      acknowledge it to the user ("Added to backlog — will tackle after current tasks"),
>      and **continue with your current task without interruption**.
> 2. Never silently absorb a request. Always either act on it or explicitly add it to the
>    backlog so nothing is lost.
>
> ### When finishing a task
> 1. Move the item from **In Progress** / **Backlog** to **Completed** with an `[x]` checkbox.
> 2. Pick up the next item from **Backlog** (top-to-bottom order).
> 3. Print the updated full task list again before starting the next item.
>
> ### General rules
> - Keep this file up to date as the single source of truth for task status.
> - Do not remove or rewrite completed items — they serve as an audit trail.
> - Use `report_progress` after each meaningful unit of work.
> - Always build and verify before marking a task complete.

---

## Completed

- [x] Add `retailPrice` field to Product (schema, DTO, frontend type, forms, portal)
- [x] Fix customer portal "Something went wrong" error (Decimal `.toFixed()` on string)
- [x] Fix `$` → `£` currency symbol in portal
- [x] Add margin display to product list and detail pages
- [x] Enhance marketing tab with "Routes to Market" procurement channels
- [x] Add "Sourcing Effectiveness Summary" metrics to marketing dashboard
- [x] Fix database persistence — switch from `prisma db push` to `prisma migrate deploy`
- [x] Create docker-entrypoint.sh to handle fresh / existing / migrated databases
- [x] Fix seed script to not reset admin password on every container restart
- [x] Expand delivery address: street, street 2, city, county, postcode (schema + DTO + portal)
- [x] Show bulk pricing tiers on portal product cards
- [x] Show estimated total (incl. bulk pricing) in order form
- [x] Rename "Place Order" → "Request Order" throughout portal
- [x] Fix "Failed to place order" — improved error reporting + removed stale field sends
- [x] Create this `BACKLOG.md` for task queue management

---

## Backlog

<!-- New requests go here, one per line, in the order they are received. -->

