English | [Русский](RepeatMe_MVP_spec.ru.md)

# RepeatMe — first prototype specification

Date: November 17, 2026. Brief for a coding agent: implement a small working fullstack prototype, keeping it simple and easy to adapt as the concept evolves.

## 1. Concept

RepeatMe is a topic map with cards for self-assessment and spaced repetition. Users learn through AI chats, Obsidian, articles, videos, and their own code. They save a topic, its sources, and review criteria, test themselves in a convenient way, and choose “Remember” or “Do not remember.” The application stores review history, schedules the next review, and visualizes how knowledge is being reinforced.

Learning material may remain entirely in an external source. Detailed notes and prepared answers are optional. Users perform any AI-assisted assessment themselves; model integrations are outside this version.

## 2. Stack and constraints

- Frontend: React, TypeScript, Vite, CSS Modules.
- Backend: NestJS, TypeORM, PostgreSQL.
- One user, without registration or authentication. Run the prototype locally.
- Persist data through the backend in PostgreSQL, including review history.
- Russian interface, primarily for desktop browsers.
- Provide `.env.example`, migrations, Docker Compose for the database, and a short README with startup commands.
- If a repository already exists, inspect its instructions first and reuse its established conventions.

## 3. Knowledge structure

Use nested categories and cards. For example: Development → JavaScript → Asynchronous programming → Promise card. There may be any number of top-level categories. A category may contain both subcategories and cards. A card is the final reviewable item.

A category has a name and an optional parent category. Categories have no reviews of their own: their statistics are calculated from all cards in the branch.

A card contains:

- A required topic title.
- An optional category; allow quickly saving a card at the root.
- An optional Markdown explanation.
- Sources: a list of labels and links, including external chats and notes.
- Review criteria: free text containing questions, tasks, or an expected result.
- The next review date and scheduling algorithm state.
- Attempt history: timestamp and “Remember” / “Do not remember” result.

Allow saving a card with only a title and completing it later. All data is entered manually. Links open external sources; automatic reading, importing, and synchronization are unnecessary. Do not automatically download or copy third-party material.

Support creating, renaming, editing, deleting, and moving cards and categories. Selecting a parent is sufficient for moving; drag and drop is unnecessary. Prevent category cycles. Moving a card preserves its history. Do not silently delete a nonempty category: the MVP allows deleting empty categories only.

## 4. Interface

### Sidebar

An expandable tree of categories and cards, a link to the overall overview, and creation actions. Cards have a colored state indicator with a clear label or tooltip. Categories show a compact distribution of descendant card states and a count of cards due for review. Do not communicate meaning through color alone.

### Main screen: knowledge reinforcement overview

Show the overall overview on entry. Selecting a category opens the same overview scoped to its entire branch. Use the same calculation and rendering mechanism for both scopes.

- A large stacked horizontal bar showing counts of new, forgotten, weakly reinforced, reinforcing, and stable cards, with a legend and exact counts.
- Review coverage: “Reviewed X of Y cards.”
- The number of cards due for review, with overdue cards identified separately.
- Immediate subcategories with compact distribution bars and due counts, alongside cards directly within the selected level.
- A “Start review” button for the current scope and access to its queue.
- A clear empty state inviting the user to create their first category or card.

This is a visual overview of actual application data. Do not present it as the probability of remembering material or a percentage of mastery of an entire discipline. CSS or simple SVG is sufficient for the bars.

### Card view and editor

Show the title, location, state, next review date, criteria, sources, Markdown explanation, and a simple attempt history. A text editor and preview are sufficient for Markdown. Support standard formatting, links, and code blocks using an existing library rather than a custom parser. Render Markdown without executing arbitrary HTML.

## 5. Review workflow

1. The user starts the queue for the entire map or a selected category and all its descendants.
2. The application shows the card title and review criteria. Hide the explanation until the user selects “Show material”; source links remain available.
3. The user recalls the topic, completes the task, and checks their answer against a source or independently with AI. Answer entry and automatic grading are unnecessary.
4. The user selects “Remember” or “Do not remember.” Disable repeated clicks while saving.
5. The backend records the attempt and updates the schedule atomically. The UI shows the next review date and proceeds to the next card. On failure, do not treat the result as saved; allow retrying.
6. At the end, show how many cards were reviewed and how many results belong to each type. Allow ending a session early; saved attempts remain stored.

New cards enter the queue immediately. Other cards enter when their scheduled date arrives. Cards whose last result was “Do not remember” come first, then new cards, then the remaining cards. Within each group, sort by the earliest review date. Show each card only once in a session. Also allow manually reviewing an individual card before its due date.

## 6. Initial scheduling rules

The following numbers are explicit prototype settings, not a scientific model of memory. Keep them in one place so they can be replaced easily.

- After consecutive “Remember” results, schedule reviews in 1, 3, 7, 14, and 30 calendar days; use 30 days thereafter.
- After “Do not remember,” reset the success streak and schedule a review for the next day. The next “Remember” starts the sequence again.
- Calculate calendar days in one explicit prototype time zone: Europe/Moscow. A date of today means “due”; an earlier date means “overdue.” Store history timestamps with an unambiguous time zone.
- “New”: no attempts yet. “Forgotten”: the last attempt was “Do not remember.” “Weakly reinforced”: a streak of one “Remember.” “Reinforcing”: a streak of two. “Stable”: a streak of three or more.
- Display the due status separately from the knowledge state. Being overdue does not automatically make a card “Forgotten.”
- Calculate category and overall statistics from all cards within the scope, counting each once. Include new cards in both distributions and totals. Do not average child-category averages: large and small branches must not have equal weight.
- Calculate card states, queues, and aggregations using the same backend rules. The UI displays the result.

## 7. First-version scope

Saved groups may later act as filters over the existing map: they select topics and categories while sharing the same history, results, and schedules. Do not create group UI or separate group entities now. A common mechanism for retrieving queues and statistics for a selected branch is sufficient.

Also defer: a canvas map, Obsidian and AI integrations, chat imports, automatic question generation, notifications, audio, gamification, and collaboration.

## 8. Implementation guidelines

- Use the minimum number of entities and modules needed for categories, cards, and attempt history. Design a small schema and REST API around these workflows; do not build a general learning platform.
- Use ordinary NestJS controllers/services and TypeORM. Additional repository layers, CQRS, an event bus, microservices, and background workers are unnecessary.
- Separate frontend responsibilities into the tree, overview, card/form, and review flow. Keep calculations outside JSX. Avoid both a giant component and excessive one-off wrappers.
- Do not introduce global state, a graph library, or a heavy editor without a current workflow need. Reuse dependencies in an existing repository.
- Add basic input validation, clear errors, and loading states. User registration and a permissions model are unnecessary.
- Implement three complete stages in sequence: structure and persistence → reviews and scheduling → visual overview. Keep each stage runnable. Complete the described prototype rather than stopping after planning.
- Focus tests on the scheduling algorithm, date boundaries, resetting after failure, nested category aggregation, and cycle prevention. Verify the main user workflow. Do not add tests solely for formal coverage.
- At completion, briefly report what was built, how to run it, what was verified, and what remains outside the MVP.

## 9. Acceptance criteria

The user creates a tree, adds a card with a link to their chat and review criteria, sees it marked as new in the map and overview, completes a review, and receives a next review date. Everything persists after reloading. A new result updates the card state, all ancestor categories, and the overall overview. The user can review a selected branch, move a card while preserving history, and distinguish forgotten material from an overdue review.
