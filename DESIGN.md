---
name: Kapa
colors:
  surface: '#fdf9f5'
  surface-dim: '#ddd9d6'
  surface-bright: '#fdf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ef'
  surface-container: '#f1ede9'
  surface-container-high: '#ebe7e4'
  surface-container-highest: '#e5e2de'
  on-surface: '#1c1c19'
  on-surface-variant: '#58423b'
  inverse-surface: '#31302e'
  inverse-on-surface: '#f4f0ec'
  outline: '#8b716a'
  outline-variant: '#dfc0b7'
  surface-tint: '#944a00'
  primary: '#894400'
  on-primary: '#ffffff'
  primary-container: '#ad5800'
  on-primary-container: '#fff1e9'
  inverse-primary: '#ffb784'
  secondary: '#3e6089'
  on-secondary: '#ffffff'
  secondary-container: '#afd1ff'
  on-secondary-container: '#375a82'
  tertiary: '#64534a'
  on-tertiary: '#ffffff'
  tertiary-container: '#7d6b61'
  on-tertiary-container: '#fff0e9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc6'
  primary-fixed-dim: '#ffb784'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#713700'
  secondary-fixed: '#d2e4ff'
  secondary-fixed-dim: '#a6c9f7'
  on-secondary-fixed: '#001c37'
  on-secondary-fixed-variant: '#24496f'
  tertiary-fixed: '#f5ded2'
  tertiary-fixed-dim: '#d8c2b7'
  on-tertiary-fixed: '#251912'
  on-tertiary-fixed-variant: '#53443b'
  background: '#fdf9f5'
  on-background: '#1c1c19'
  surface-variant: '#e5e2de'
typography:
  headline-xl:
    fontFamily: Be Vietnam Pro
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 20px
  margin-tablet: 40px
  gutter: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style

The brand identity centers on warmth, empathy, and the joyous connection between humans and animals. This design system moves away from clinical shelter aesthetics toward a vibrant, lifestyle-oriented experience that celebrates the personality of each pet. 

The design style is **Modern Organic**, blending clean layouts with soft, approachable elements. It prioritizes emotional resonance through high-quality photography and intentional use of whitespace, ensuring the interface feels like a welcoming community rather than a transactional marketplace.

## Colors

The palette is anchored by a spirited **Zesty Orange** (#F18322), used strategically for primary actions and brand emphasis to evoke energy, optimism, and heart. **Deep Denim** (#2A4E75) provides a grounding contrast, used for secondary elements and navigation to instill a sense of reliability and trust.

Backgrounds utilize **Surface Cream** (#FFFBF7) instead of pure white to create a softer, more "analog" feel that reduces eye strain. **Soft Peach** (#FFE7DB) serves as a subtle container color to group related information without adding visual weight.

## Typography

This design system uses a dual-font approach to balance personality with extreme legibility. 

- **Be Vietnam Pro** is used for headlines. Its clean, geometric construction and modern finish feel professional yet warm, providing a contemporary edge to the brand's welcoming tone.
- **Plus Jakarta Sans** is used for all body text and UI labels. Its soft terminals and open apertures ensure high readability even on small mobile screens.

Keep line lengths for body text between 45-75 characters to maintain a comfortable reading rhythm for pet biographies.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a base unit of 8px. 

- **Mobile:** 4-column grid with 20px outside margins.
- **Tablet/Desktop:** 12-column grid with a maximum content width of 1140px.

A "Loose & Airy" spacing rhythm is preferred. Use generous vertical stacking (`stack-lg`) between distinct content sections to allow pet photography to breathe. Use `stack-sm` for internal card padding to keep related metadata (age, breed, size) tightly grouped.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Soft Ambient Shadows**. 

Avoid heavy dropshadows or harsh borders. Instead, use subtle color shifts:
1. **Level 0 (Base):** Surface Cream (#FFFBF7).
2. **Level 1 (Cards):** Pure White (#FFFFFF) with a 2% opacity "Zesty Orange" tinted shadow (4px blur, 2px offset).
3. **Level 2 (Modals/Popovers):** Pure White (#FFFFFF) with a 10% opacity "Deep Denim" tinted shadow (12px blur, 6px offset).

Interactive elements like buttons use a slight vertical offset when hovered or pressed to simulate a tactile "squish" effect.

## Shapes

The shape language is **Rounded** and friendly. 

- Standard components (buttons, input fields) use a 0.5rem (8px) radius.
- Large containers (Pet profile cards, hero images) use a 1rem (16px) radius.
- Decorative elements or selection chips use a full-pill radius to contrast against the more structured content blocks.

Images of pets should always feature rounded corners to maintain the soft brand aesthetic.

## Components

### Buttons
- **Primary:** Filled Zesty Orange (#F18322) with white text. High-contrast and prominent.
- **Secondary:** Outlined Deep Denim (#2A4E75) with 1.5px border weight. 
- **Ghost:** Text-only in Deep Denim for low-priority actions like "Cancel" or "View More."

### Cards (Pet Profiles)
Cards are the heart of the app. They feature a full-bleed top image, a Soft Peach (#FFE7DB) footer area for metadata (Age, Gender, Distance), and a heart icon in the top-right corner for "Favoriting."

### Chips/Tags
Used for pet attributes (e.g., "Good with kids," "Vaccinated"). These should use the Soft Peach background with Deep Denim text for high legibility without distracting from the main CTA.

### Inputs & Selection
Text fields use a thin 1px border in a muted version of Deep Denim. Radio buttons and checkboxes, when active, use the Zesty Orange color to provide a warm, clear feedback loop.

### Adoption CTA
A specialized persistent bottom bar component for pet profile pages. It should feature a secondary "Ask a Question" button and a primary "Start Adoption" button to ensure the path to support is always visible.