# UI/UX Design Playbook

## Design before code
- Identify users, core jobs-to-be-done, primary action, information density, and product personality.
- Choose a specific visual direction for this product; do not reuse one generic template for every app.
- If available, use installed UI/UX skills and reputable visual references. Do not claim research that was not performed.
- Define color roles, typography, spacing, radii, borders, elevation, motion, and responsive breakpoints before building many components.

## Visual hierarchy
- Make the page purpose and primary action obvious within seconds.
- Use deliberate alignment, whitespace, readable content widths, and consistent spacing.
- Use varied compositions where appropriate; do not make every section a stack of identical cards.
- Avoid random gradients, excessive glassmorphism, excessive shadows, noisy backgrounds, and decoration without purpose.
- Use real product context and meaningful copy instead of generic filler.

## Design tokens
- Prefer CSS variables or the existing theme system for semantic tokens such as background, surface, text, muted text, border, primary, success, warning, and danger.
- Use a consistent spacing scale, type scale, radius scale, and shadow scale.
- Do not hardcode a new color or spacing value when an existing token fits.
- Ensure both light and dark themes remain readable if both are supported.

## Components and states
- Design default, hover, focus-visible, active, disabled, loading, success, and error states as appropriate.
- Include loading, empty, error, and success states for data-driven areas.
- Forms need labels, helpful validation, and clear submission feedback.
- Dialogs need clear purpose, sensible focus behavior, keyboard dismissal where appropriate, and mobile-friendly sizing.
- Tables need readable density, clear column labels, useful empty states, and mobile behavior.

## Responsive behavior
- Build mobile-first and test narrow, medium, and wide viewports.
- Prevent horizontal overflow and clipped content.
- Make navigation, sidebars, dialogs, forms, charts, and tables usable on touch screens.
- Use fluid layouts and responsive typography rather than relying on fixed widths.

## Accessibility
- Use semantic HTML and proper labels.
- Preserve keyboard navigation and visible focus indicators.
- Do not communicate status using color alone.
- Check contrast, touch target size, reduced-motion preferences, and meaningful alternative text.
- Use accessible names for icon-only buttons.

## Motion and imagery
- Use motion to clarify state changes or guide attention, not as decoration everywhere.
- Respect reduced-motion preferences and keep animations performant.
- Preserve image aspect ratios and provide fallbacks.
- Avoid broken URLs, unrelated stock imagery, and emoji as substitutes for a consistent icon set.

## Implementation and review
- Follow the project's existing stack and component library where sensible.
- Do not add dependencies without a clear benefit.
- After implementation, inspect the rendered page if browser tools are available.
- Check visual hierarchy, alignment, spacing, overflow, responsiveness, focus, and key interactions.
- Fix visible issues before declaring the UI finished.
