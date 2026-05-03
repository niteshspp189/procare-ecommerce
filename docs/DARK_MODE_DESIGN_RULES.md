# ProCare Storefront — Dark Mode Design Rules

Dark mode activates automatically when the user's **OS/browser** is set to dark preference (`prefers-color-scheme: dark`). No manual toggle is needed.

---

## How It Works

| Layer | Mechanism |
|---|---|
| Tailwind `dark:` utilities | `darkMode: "media"` in `tailwind.config.js` — fires when OS is dark |
| Global colours | CSS variables in `globals.css` (e.g. `--pc-bg`, `--pc-text`) |
| Medusa UI components | Always light (`data-mode="light"` on `<html>`) — checkout/buttons unchanged |

---

## CSS Variables (use these in custom CSS)

```css
/* Background */
var(--pc-bg)          /* main page background */
var(--pc-bg-subtle)   /* slightly lifted surface (cards, panels) */
var(--pc-bg-elevated) /* hover states, popovers */

/* Text */
var(--pc-text)        /* primary body text */
var(--pc-text-muted)  /* secondary / captions */

/* Borders */
var(--pc-border)      /* all dividers and outlines */

/* Nav */
var(--pc-nav-bg)      /* nav bar background */
var(--pc-nav-border)  /* nav bottom border */

/* Cards / Inputs */
var(--pc-card-bg)     /* white cards in light, dark-surface in dark */
var(--pc-input-bg)    /* form inputs */
```

---

## Rules for Every New Component

### ✅ DO — use Tailwind dark: variants

```tsx
// Background
<div className="bg-white dark:bg-[#1a1a1a]">

// Text
<p className="text-black dark:text-gray-100">
<span className="text-gray-500 dark:text-gray-400">

// Border
<div className="border-gray-200 dark:border-[#2d2d2d]">

// Input / Textarea
<input className="bg-white dark:bg-[#1a1a1a] text-black dark:text-gray-100 border-gray-200 dark:border-[#2d2d2d]" />

// Hover states
<button className="hover:bg-gray-100 dark:hover:bg-gray-800">
```

### ✅ DO — use CSS variables for raw CSS

```css
.my-component {
  background-color: var(--pc-bg);
  color: var(--pc-text);
  border-color: var(--pc-border);
}
```

### ❌ DON'T — hardcode light colours in inline styles

```tsx
// BAD — inline styles NEVER respond to dark mode
<nav style={{ backgroundColor: '#fff', color: '#000' }}>

// GOOD — move colour to className with dark: variant
<nav style={{ padding: '12px' }} className="bg-white dark:bg-[#111]">
```

### ❌ DON'T — use static grey that becomes unreadable

```tsx
// BAD — too light in dark mode
<Text className="text-gray-300">

// GOOD — legible in both modes
<Text className="text-gray-600 dark:text-gray-300">
```

### ❌ DON'T — forget hover states

```tsx
// BAD — hover turns element white in dark mode
<button className="hover:bg-gray-100">

// GOOD
<button className="hover:bg-gray-100 dark:hover:bg-gray-800">
```

---

## Section-by-Section Reference

| Section | Light | Dark |
|---|---|---|
| Page background | `bg-white` | `dark:bg-[#0f0f0f]` |
| Card / panel | `bg-white` | `dark:bg-[#1a1a1a]` |
| Subtle surface | `bg-gray-50` | `dark:bg-[#1a1a1a]` |
| Elevated (popovers) | `bg-gray-100` | `dark:bg-[#242424]` |
| Primary text | `text-black` / `text-gray-900` | `dark:text-gray-100` |
| Secondary text | `text-gray-600` | `dark:text-gray-400` |
| Muted text | `text-gray-400` | `dark:text-gray-500` |
| Borders | `border-gray-200` | `dark:border-[#2d2d2d]` |
| Input bg | `bg-white` | `dark:bg-[#1a1a1a]` |
| Shadow | `shadow-sm` | `dark:shadow-none dark:ring-1 dark:ring-[#2d2d2d]` |
| Nav bar bg | `bg-white` | `dark:bg-[#111]` |
| Top/footer bar | always `bg-black` | no change needed |

---

## Checklist Before Submitting a New Component

- [ ] No `style={{ color: ... }}` or `style={{ backgroundColor: ... }}` with hardcoded light colours
- [ ] Every `bg-white` has a `dark:bg-[...]` counterpart
- [ ] Every `text-black` / `text-gray-900` has a `dark:text-...` counterpart
- [ ] Borders use `dark:border-[#2d2d2d]`
- [ ] Hover states have dark variants
- [ ] Inputs have `dark:bg-[#1a1a1a] dark:text-gray-100`
- [ ] Run with OS set to dark mode and visually verify readability

---

## Admin Panel (Medusa Admin)

Admin uses a **separate theme system** via Medusa UI design tokens (`bg-ui-bg-*`, `text-ui-fg-*`). Do **not** use hardcoded Tailwind classes in admin widgets. Always use Medusa tokens:

```tsx
// Admin — correct tokens
className="bg-ui-bg-base text-ui-fg-base border-ui-border-base"
className="bg-ui-bg-subtle text-ui-fg-subtle"
className="bg-ui-bg-field text-ui-fg-base border-ui-border-base"
```
