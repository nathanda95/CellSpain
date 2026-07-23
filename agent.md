# AGENTS.md

Read `README.md` before making architectural or domain-level changes.
It contains the main project documentation and design principles.

## Core rules

- Prefer targeted changes over large rewrites.
- Preserve the existing architecture and naming conventions.
- Inspect existing domain logic and shared utilities before introducing
  duplicate logic.
- Do not move business logic into `App.tsx`.

## Historical data

Historical survey data must never be silently reinterpreted.

Questionnaire changes only affect future imports.

Each import is bound to the questionnaire configuration that was active
when the import started.

Do not recompute historical labels, categories, scores, or mappings using
the current questionnaire configuration.

## Imports

Survey structures may evolve over time.

Import logic must remain resilient to:
- changed column names;
- missing configured questions;
- additional unknown columns;
- questionnaire version changes.

Prefer configuration-driven behavior over hardcoded survey questions.

## Fiscal periods

CellSpain uses a fiscal cycle starting in July:

- Q1: July–September
- Q2: October–December
- Q3: January–March
- Q4: April–June

The displayed fiscal year is the year in which the cycle starts.

Examples:
- July 2025 -> Q1 2025
- January 2026 -> Q3 2025
- June 2026 -> Q4 2025
- July 2026 -> Q1 2026

Never use standard calendar-quarter logic for dashboard periods.

## Validation

After relevant changes, run:

npm test
npm run build

Do not consider a task complete if tests or TypeScript compilation fail.

Add or update tests when changing:
- import behavior;
- questionnaire versioning;
- historical-data behavior;
- fiscal-period calculations.

## Scope

Do not refactor unrelated code unless required by the requested change.

When requirements are ambiguous, preserve existing application behavior
rather than inventing new behavior.