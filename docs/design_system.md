# TravelLord AI — Design System & Visual Identity Specification

## 1. Brand Identity & Messaging
- **Brand Name**: TravelLord AI
- **Primary Tagline**: *"Travel informed. Travel aware."*
- **Supporting Line**: *"Know more about the journey ahead."*
- **Product Statement**: *"Understand the hazards, examine the evidence and make better-informed travel decisions."*

## 2. Color Palette & Semantic Tokens

| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **Midnight Navy** | `#102A43` | Primary text, navigation bar, brand logo, strong borders |
| **Travel Teal** | `#147D75` | Primary action buttons, active tab indicators, primary route line |
| **Fresh Mint** | `#65D6AD` | Brand accents, interactive highlights, focus states |
| **Warm White** | `#F7F9FC` | Page background, subtle contrasting panels |
| **White** | `#FFFFFF` | Cards, surfaces, modal dialogs, flyouts |
| **Slate** | `#526477` | Secondary text, captions, metadata, inactive icons |
| **Caution Amber** | `#B45309` | Moderate / cautionary reported risk, advisory alerts |
| **Alert Red** | `#B42318` | High-priority warnings, severe weather, confirmed blockades |
| **Verified Green**| `#16794B` | Official verification badge *(Never represents 100% safety)* |

## 3. Typography & Hierarchy
- **Headings Font**: `Manrope`, sans-serif (Google Fonts)
- **Body Font**: `Inter`, sans-serif (Google Fonts)
- **Fallback**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### Scale
- **Desktop Hero Title**: 56px (3.5rem), line-height: 1.15, font-weight: 800
- **Mobile Hero Title**: 38px (2.375rem), line-height: 1.2, font-weight: 800
- **Page Headings (h1/h2)**: Desktop 36px (2.25rem), Mobile 28px (1.75rem), font-weight: 700
- **Card Headings (h3)**: 20px (1.25rem), font-weight: 600
- **Body Text**: 15px - 16px (1rem), line-height: 1.6, font-weight: 400
- **Metadata & Badges**: 12px - 13px (0.8125rem), font-weight: 500

## 4. Components & Elevation
- **Spacing Units**: Strict 4px increments (4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px, 64px).
- **Corner Radii**: Cards 14px, Buttons 8px - 10px, Badges 9999px (full pill).
- **Shadows**: Restrained, soft elevation: `0 2px 8px -2px rgba(16, 42, 67, 0.06), 0 4px 16px -4px rgba(16, 42, 67, 0.08)`.
- **Accessibility**: High-contrast ratios (> 4.5:1 for normal text, > 3:1 for large text). Never rely on color alone to denote danger level (always pair with icons and explicit textual labels).
