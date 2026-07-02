# AI Tasker — Product Specification

## 1. Core Information
* **Name**: AI Tasker
* **Type**: Freelance Marketplace with AI Integration
* **Register**: **Product** (App UI focused on productivity and utility, not branding/marketing)

## 2. Design System & Tokens
* **Color Strategy**: **Restrained** (slate base for neutrality, vibrant violet accent kept under 10% for focal points)
* **Typography**: Font family `Geist` (imported from Google Fonts, fallback to `system-ui`, `sans-serif`) across all headings, body, labels, and data grids to project a modern, clean, tech-centric, and AI-focused aesthetic.
* **Layout**: 
  * Responsive Desktop-first layout with collapsible/adaptive side navigation.
  * Fixed rem scale (avoid fluid typography for tool layouts to maintain grid readability).
* **States**: Full semantic support for interactive elements (Default, Hover, Focus, Active, Disabled, Loading, Selected).
* **Loaders**: Skeleton screens for content sections (no spinner slop).

## 3. UI Guidelines
* **Interactive Elements**: All buttons use pointer cursors. 
* **Cards**: Structured data tables and forms over repetitive generic cards.
* **Modals**: Used sparingly for critical context confirmation only; inline or progressive disclosure is preferred.
* **Notifications**: Inline alert cards and real-time top-bar bell indicator.
