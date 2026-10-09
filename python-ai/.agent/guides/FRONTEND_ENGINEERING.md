# Frontend Engineering Playbook

## Architecture
- Inspect the current framework and version before choosing APIs.
- Keep components focused and compose them from smaller pieces.
- Separate reusable UI, domain logic, API access, and state management when that improves clarity.
- Avoid giant components, duplicated logic, and abstractions used only once without a clear benefit.
- Preserve established routing, state management, and styling conventions unless a change is justified.

## React and Next.js
- Follow the installed React and Next.js versions and their documented conventions.
- In Next.js App Router projects, keep Server Components by default and add Client Components only when browser APIs, state, or event handlers require them.
- Never expose server-only secrets through client-side code or public environment variables.
- Avoid unnecessary effects; derive values during render when possible and use effects for genuine synchronization.
- Use stable keys and avoid mutating state directly.
- Handle asynchronous loading, cancellation/stale responses, and errors intentionally.

## State and forms
- Keep state close to where it is used.
- Avoid duplicating derived state.
- Choose local state, URL state, context, or a state library according to the scope and persistence needs.
- Validate forms on both client and server when data crosses a trust boundary.
- Preserve user input when recoverable errors occur.
- Prevent duplicate submissions and clearly communicate progress.

## Styling
- Follow the existing Tailwind version and configuration.
- Prefer design tokens, reusable variants, and consistent responsive patterns.
- Avoid unnecessary inline styles and arbitrary z-index values.
- Use semantic class patterns and extract components when repetition becomes meaningful.
- Do not mix multiple styling systems without a clear reason.

## Accessibility and semantics
- Use buttons for actions and links for navigation.
- Use headings in a meaningful hierarchy and labels for inputs.
- Support keyboard operation, focus visibility, and appropriate ARIA only when native semantics are insufficient.
- Give images useful alt text; decorative images should not create redundant announcements.

## Performance
- Measure before applying complex optimizations.
- Avoid unnecessary re-renders, oversized client bundles, duplicate requests, and loading entire datasets without need.
- Use pagination, virtualization, image optimization, and code splitting when justified by data size and user experience.
- Keep dependencies lean and verify bundle/build impact when tooling supports it.

## Before completion
- Check responsive layouts and interaction states.
- Run relevant lint, type-check, tests, and build commands.
- Inspect console/network errors when tools are available.
- Remove temporary debug output and unused code introduced by the change.
