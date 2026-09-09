# ZimplifAI SEO and Conversion Design

## Objective

Turn the showroom into a clearer B2B acquisition site while making its real work indexable and shareable. The implementation must increase qualified-contact intent without inventing testimonials, client logos, outcomes, or market claims.

## Audience and message

The primary visitor is a Spanish-speaking owner or operational lead with an expensive manual process. The site will retain the existing promise, “Simplifico procesos. Implanto IA.”, and make the next action concrete: request a no-obligation 30-minute process diagnosis. The secondary visitor is a potential technical collaborator evaluating the project portfolio.

## Conversion design

The home page keeps the visual identity and existing section order but adds four conversion elements:

1. Hero and navigation CTAs use the same concrete action, “Diagnóstico de 30 min”.
2. A concise process section explains the three stages: diagnose, implement, and measure/iterate. It must avoid promise language about specific savings or results.
3. A qualification block explains what to include in a contact request: the process, its frequency, current tools, and desired outcome.
4. The contact form’s submit CTA and supporting copy reflect the diagnosis. It must not promise a response time unless it can be operationally guaranteed.

The existing showroom remains, but each project links to an indexable case-study detail page. The cards and modals remain useful for browsing; detail pages provide a linkable, crawlable source of truth.

## SEO architecture

- Add a static route at `/proyectos/[slug]` generated from `data/projects.ts`.
- Extend each project’s existing typed data with SEO-ready case-study content derived only from its present description, problem, stack, status, and known URL. No performance metrics beyond the existing zCADe and VerifAI test data may be added.
- Give every case study unique `title`, `description`, canonical URL, Open Graph/Twitter metadata, breadcrumbs, and `CreativeWork` JSON-LD.
- Add `Service` JSON-LD for the four public services and change the site’s organization schema to `ProfessionalService` while retaining the founder/person entity.
- Replace SVG-only social sharing metadata with a valid generated Open Graph PNG route. Retain the existing SVG asset only as a non-social asset.
- Expand the sitemap to include all case-study pages and exclude routes that must not be indexed.

## Trust and privacy

- Create a visible privacy page that identifies the contact-data purpose, email processor (Resend), analytics option, retention/contact route, and privacy contact. Its wording must be clear and intentionally non-legal-advice.
- Link it beside the contact form, in the analytics consent UI, and footer.
- Do not activate new trackers or add dependencies.

## Accessibility and performance

- The skip link must target `#contenido-principal` on the `<main>` element.
- Project dialogs must trap keyboard focus while open and restore focus to their triggering card when closed.
- The mobile menu must close with Escape and identify itself with `aria-controls`.
- The preloader may remain brand-forward but must be shortened so the initial interaction delay stays below two seconds after hydration; `prefers-reduced-motion` continues to bypass it.
- Preserve the existing dark visual system and all reduced-motion behavior. No new large client-side dependency is permitted.

## Validation

- `npm run lint`, `npm run typecheck`, and `npm run build` must pass.
- Add focused automated tests for pure SEO/data utilities if a lightweight native test mechanism is introduced; avoid adding a full browser-test framework solely for static metadata checks.
- Manually inspect desktop and 390 px mobile layouts, the mobile navigation, one project page, the modal keyboard flow, and the contact/privacy links.
