# ZimplifAI SEO and Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve qualified-lead conversion and organic discoverability with crawlable case studies, technical SEO, and accessible contact paths.

**Architecture:** Project data remains the source of truth. Server-rendered case-study routes consume it for page metadata and structured data; client showroom cards provide in-site navigation. Home conversion content stays component-based, and site-wide schema/metadata is owned by the root layout.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-09-seo-conversion-design.md`

## Global Constraints

- Preserve the dark design language and `prefers-reduced-motion` behavior.
- Do not invent testimonials, client logos, business outcomes, or project metrics.
- Do not introduce any runtime dependency beyond development-only Vitest.
- Do not edit the user’s untracked atmosphere files.
- Every public Spanish route must use canonical metadata and a meaningful title/description.

---

### Task 1: Project SEO data and test harness

**Files:**
- Modify: `package.json`
- Modify: `data/projects.ts`
- Create: `lib/projects.ts`
- Create: `lib/projects.test.ts`

**Interfaces:**
- Produces `getProjectBySlug(slug: string): Project | undefined`, `getProjectPath(project: Pick<Project, "id">): string`, and `getProjectSeoDescription(project: Project): string` from `lib/projects.ts`.
- Extends `Project` with `caseStudy: { context: string; implementation: string; outcome: string }` using only facts already in the project data.

- [ ] **Step 1: Add the test command and write failing tests**

Add `"test": "vitest run"` and development dependency `vitest`. Create `lib/projects.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { projects } from "@/data/projects";
import { getProjectBySlug, getProjectPath, getProjectSeoDescription } from "@/lib/projects";

describe("project SEO helpers", () => {
  it("returns a project for its public slug", () => {
    expect(getProjectBySlug("elektrizia")?.name).toBe("ElektriZIA");
  });

  it("does not expose unknown projects", () => {
    expect(getProjectBySlug("not-a-project")).toBeUndefined();
  });

  it("creates canonical case-study paths", () => {
    expect(getProjectPath(projects[0])).toBe("/proyectos/elektrizia");
  });

  it("creates a concise description from real project data", () => {
    expect(getProjectSeoDescription(projects[0])).toContain("ElektriZIA");
  });
});
```

- [ ] **Step 2: Run the tests to verify the expected failure**

Run: `npm test -- lib/projects.test.ts`

Expected: failure because the project helper module does not yet exist.

- [ ] **Step 3: Implement the minimum typed project helpers and case-study fields**

Create `lib/projects.ts` with lookup and path helpers over the exported array. Add concise `caseStudy` strings to each project using only existing descriptions/problems/status. `getProjectSeoDescription` must return `${name}: ${tagline} ${description}` truncated at a word boundary to 155 characters.

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- lib/projects.test.ts`

Expected: 4 passing tests.

- [ ] **Step 5: Commit the self-contained data layer**

```bash
git add package.json package-lock.json data/projects.ts lib/projects.ts lib/projects.test.ts
git commit -m "feat: add project SEO data helpers"
```

### Task 2: Indexable project pages and metadata

**Files:**
- Create: `app/proyectos/[slug]/page.tsx`
- Create: `app/proyectos/[slug]/not-found.tsx`
- Modify: `components/ProjectCard.tsx`
- Modify: `components/ProjectModal.tsx`
- Modify: `app/sitemap.ts`

**Interfaces:**
- Consumes `getProjectBySlug`, `getProjectPath`, `getProjectSeoDescription` from `lib/projects.ts`.
- Produces static `/proyectos/[slug]` pages generated from `projects`.

- [ ] **Step 1: Write a failing metadata test**

Create `app/proyectos/[slug]/page.test.ts` that imports `generateMetadata` and asserts that `generateMetadata({ params: Promise.resolve({ slug: "elektrizia" }) })` returns title and canonical values containing `ElektriZIA` and `/proyectos/elektrizia`.

- [ ] **Step 2: Run the test to verify the expected failure**

Run: `npm test -- app/proyectos/[slug]/page.test.ts`

Expected: failure because the route module does not exist.

- [ ] **Step 3: Implement the server-rendered case-study route**

Implement `generateStaticParams`, `generateMetadata`, breadcrumb + `CreativeWork` JSON-LD, a semantic case-study layout, related contact CTA, and visible external project URL only where present. Use `notFound()` for missing slugs. Do not use client-only code.

- [ ] **Step 4: Link browsing UI to canonical pages**

Make each project card expose a conventional accessible link to its case-study path while retaining the modal as an optional quick preview. In the modal add “Ver caso completo” before external links.

- [ ] **Step 5: Expand sitemap and verify the route**

Add every `getProjectPath(project)` to `app/sitemap.ts`. Run:

```bash
npm test -- app/proyectos/[slug]/page.test.ts
npm run build
```

Expected: test passes and static project routes appear in build output.

- [ ] **Step 6: Commit the indexable case-study feature**

```bash
git add app/proyectos components/ProjectCard.tsx components/ProjectModal.tsx app/sitemap.ts
git commit -m "feat: publish indexable project case studies"
```

### Task 3: Home-page conversion flow

**Files:**
- Create: `components/Process.tsx`
- Modify: `components/Hero.tsx`
- Modify: `components/Nav.tsx`
- Modify: `components/Contact.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces a static `Process` component with three steps: `Entendemos el proceso`, `Diseñamos e implantamos`, and `Medimos e iteramos`.
- Keeps all CTAs anchored to `#contacto` and labels the primary action `Diagnóstico de 30 min`.

- [ ] **Step 1: Write a failing component render test**

Create `components/Process.test.tsx` using Vitest with React server rendering and assert the output includes the three prescribed step headings and “Sin compromiso”.

- [ ] **Step 2: Run the test to verify the expected failure**

Run: `npm test -- components/Process.test.tsx`

Expected: failure because `Process` does not exist.

- [ ] **Step 3: Implement conversion content without unverified claims**

Create the process component in the existing `SectionLabel`/`Reveal` style. Insert it after Services. Change hero/nav/service CTAs and contact form microcopy to describe the diagnosis. Add a short form-side qualification prompt (“proceso, frecuencia, herramientas actuales y objetivo”) and an explicit privacy link.

- [ ] **Step 4: Run focused test and visually inspect responsive flow**

Run: `npm test -- components/Process.test.tsx`

Then inspect at desktop and 390 px width: primary CTA is above the fold, process remains readable, and CTA has no overlap with the analytics notice.

- [ ] **Step 5: Commit conversion flow**

```bash
git add components/Process.tsx components/Process.test.tsx components/Hero.tsx components/Nav.tsx components/Contact.tsx app/page.tsx
git commit -m "feat: clarify conversion journey"
```

### Task 4: Site-wide SEO, social image, and privacy

**Files:**
- Create: `app/opengraph-image.tsx`
- Create: `app/privacidad/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `components/Analytics.tsx`
- Modify: `components/Footer.tsx`
- Modify: `app/robots.ts`

**Interfaces:**
- Produces a 1200×630 PNG route via Next.js metadata image convention.
- Produces the indexable `/privacidad` static page.

- [ ] **Step 1: Write failing metadata and privacy-link tests**

Create `app/layout.test.ts` asserting layout metadata references `/opengraph-image` and JSON-LD source contains `ProfessionalService`. Create `app/privacidad/page.test.ts` asserting privacy page renders Resend and `contacto@` content.

- [ ] **Step 2: Run tests to verify expected failures**

Run: `npm test -- app/layout.test.ts app/privacidad/page.test.ts`

Expected: failure because the new public route and metadata configuration are absent.

- [ ] **Step 3: Implement technical SEO and privacy content**

Add the generated social image, canonical root metadata, `ProfessionalService` plus existing `Person` and `Service` schema. Build the privacy page with concise, truthful handling details. Link it from consent, contact form and footer. Keep analytics opt-in unchanged.

- [ ] **Step 4: Run focused tests and build**

Run:

```bash
npm test -- app/layout.test.ts app/privacidad/page.test.ts
npm run build
```

Expected: tests pass and generated route list includes `/opengraph-image` and `/privacidad`.

- [ ] **Step 5: Commit site-wide SEO**

```bash
git add app/opengraph-image.tsx app/privacidad app/layout.tsx components/Analytics.tsx components/Footer.tsx app/robots.ts app/layout.test.ts app/privacidad/page.test.ts
git commit -m "feat: improve technical SEO and privacy"
```

### Task 5: Accessibility and interaction hardening

**Files:**
- Modify: `app/layout.tsx`
- Modify: `components/Nav.tsx`
- Modify: `components/ProjectModal.tsx`
- Modify: `components/Preloader.tsx`

**Interfaces:**
- `main` has id `contenido-principal`.
- Mobile nav uses a stable `id="menu-principal"` and closes on Escape.
- Modal accepts `triggerRef?: React.RefObject<HTMLElement | null>` or stores the active element before opening, confines Tab navigation, and restores focus on close.

- [ ] **Step 1: Write failing focus utility tests**

Extract `getFocusableElements(container: HTMLElement): HTMLElement[]` to `lib/focus.ts`; create `lib/focus.test.ts` with JSDOM to assert disabled and hidden controls are excluded and active buttons/links are included.

- [ ] **Step 2: Run focused test and verify failure**

Run: `npm test -- lib/focus.test.ts`

Expected: failure because the helper does not exist.

- [ ] **Step 3: Implement focus behavior and reduced initial delay**

Implement the utility, modal Tab/Shift+Tab wrapping and focus restoration; add Escape to mobile nav. Point the skip link to the main element. Reduce first-view preloader timings to under two seconds while preserving its session/reduced-motion bypass.

- [ ] **Step 4: Run focused test and manual keyboard check**

Run: `npm test -- lib/focus.test.ts`

Manual check: open a project; Tab stays in dialog; Escape closes and returns focus to its trigger; mobile menu closes on Escape.

- [ ] **Step 5: Commit interaction hardening**

```bash
git add lib/focus.ts lib/focus.test.ts app/layout.tsx components/Nav.tsx components/ProjectModal.tsx components/Preloader.tsx
git commit -m "fix: improve keyboard navigation and first interaction"
```

### Task 6: Full regression verification

**Files:**
- Modify only if a validation exposes a concrete defect.

- [ ] **Step 1: Run complete automated verification**

Run:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Inspect final user journeys**

At desktop and 390 px mobile verify: first CTA, mobile nav, one filter and project case-study page, privacy page, contact form privacy link, external project links, modal keyboard loop, and skip link.

- [ ] **Step 3: Review the final diff**

Run: `git diff main --stat` and `git status --short`.

Expected: only intended SEO/conversion files plus the user’s pre-existing atmosphere files are modified/untracked.

- [ ] **Step 4: Commit remaining verification fixes only when necessary**

```bash
git add <only files changed while resolving validation failures>
git commit -m "fix: resolve SEO conversion verification findings"
```
