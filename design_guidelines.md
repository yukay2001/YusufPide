# Design Guidelines: Pideci Management Panel

## Design Approach

**Selected Approach:** Design System with productivity tool inspiration

**Justification:** This is a utility-focused business management application requiring efficiency, clarity, and consistency. Drawing from Linear's clean aesthetics, Notion's organized data presentation, and modern dashboard best practices.

**Core Principles:**
- Clarity over decoration: Every element serves a functional purpose
- Efficient workflows: Minimize clicks, maximize productivity
- Data legibility: Tables and numbers must be instantly readable
- Professional warmth: Business-appropriate but approachable

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Background: 248 250 252 (slate-50 equivalent)
- Surface: 255 255 255 (white cards/panels)
- Primary: 15 23 42 (slate-900 - for headers, primary actions)
- Secondary: 100 116 139 (slate-500 - for labels, secondary text)
- Accent Success: 34 197 94 (green-500 - for profit, positive actions)
- Accent Danger: 239 68 68 (red-500 - for expenses, warnings)
- Borders: 226 232 240 (slate-200)

**Dark Mode:**
- Background: 15 23 42 (slate-900)
- Surface: 30 41 59 (slate-800)
- Primary: 248 250 252 (slate-50 - for text, buttons)
- Secondary: 148 163 184 (slate-400)
- Accent Success: 74 222 128 (green-400)
- Accent Danger: 248 113 113 (red-400)
- Borders: 51 65 85 (slate-700)

### B. Typography

**Font Stack:**
- Primary: Inter (via Google Fonts CDN) - for UI, data, and body text
- Fallback: system-ui, -apple-system, sans-serif

**Type Scale:**
- Display/Page Titles: text-2xl (24px), font-bold
- Section Headers: text-xl (20px), font-semibold
- Subsections: text-base (16px), font-semibold
- Body/Form Labels: text-sm (14px), font-normal
- Table Data: text-sm (14px), font-normal
- Helper Text: text-xs (12px), text-slate-500

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 3, 4, 6, 8 for consistency
- Component padding: p-4 or p-6
- Section spacing: mb-6 or mb-8
- Form gaps: gap-3 or gap-4
- Card spacing: p-4 internally

**Container Structure:**
- Max width: max-w-7xl for main content
- Horizontal padding: px-4 on mobile, px-6 on desktop
- Vertical rhythm: py-6 between major sections

### D. Component Library

**Navigation:**
- Horizontal tab-style navigation with rounded buttons
- Active state: darker background (bg-slate-800 text-white)
- Inactive: bg-white with subtle shadow
- Mobile: Stack vertically with full-width buttons

**Dashboard Cards:**
- 4-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- White background with border (border border-slate-200)
- Rounded corners (rounded-lg)
- Padding: p-4 or p-6
- Label above metric (text-sm text-slate-500)
- Large, bold numbers (text-3xl font-bold)

**Data Tables:**
- Full-width with border-collapse
- Header row with bottom border (border-b-2)
- Alternating row backgrounds optional (hover:bg-slate-50)
- Cell padding: p-3
- Right-align numerical columns
- Sticky header on scroll for long tables

**Forms:**
- Vertical label placement (label above input)
- Input styling: border border-slate-300, rounded-md, p-2.5, w-full
- Focus state: ring-2 ring-slate-400
- Button alignment: End of form row or full-width on mobile
- Grid layout for multi-field forms (grid-cols-1 md:grid-cols-3 lg:grid-cols-4)

**Buttons:**
- Primary: bg-slate-800 text-white, hover:bg-slate-700
- Secondary/Neutral: bg-white border border-slate-300, hover:bg-slate-50
- Danger (expenses): bg-red-600 text-white, hover:bg-red-700
- Success: bg-green-600 text-white, hover:bg-green-700
- Padding: px-4 py-2.5
- Border radius: rounded-md
- Font weight: font-medium

**Filter Controls:**
- Horizontal layout with gap-3
- Date inputs styled consistently with form inputs
- Clear/Reset button as secondary style
- Export button with download icon (use Heroicons)

**Critical Stock Alerts:**
- Red border-left indicator (border-l-4 border-red-500)
- Grid layout (grid-cols-1 md:grid-cols-3)
- Product name and quantity clearly visible

### E. Icons

**Icon Library:** Heroicons (outline style) via CDN
- Use for: navigation indicators, action buttons (download, add, delete)
- Size: w-5 h-5 for inline icons
- Color: Match text color (currentColor)

**Suggested Icons:**
- Dashboard: ChartBarIcon
- Sales: CurrencyDollarIcon
- Expenses: ReceiptTaxIcon
- Stock: CubeIcon
- Reports: DocumentChartBarIcon
- Export: ArrowDownTrayIcon
- Add: PlusIcon

---

## Interaction Patterns

**No Animations:** Keep interactions instant and functional - no fade-ins, slide-outs, or decorative animations

**Hover States:**
- Tables: Subtle background change (hover:bg-slate-50)
- Buttons: Darken by one shade
- Cards: Optional subtle shadow increase

**Data Entry Flow:**
- Form clears immediately after successful submission
- Brief success feedback (could be green border flash on submit button)
- Focus returns to first input field

---

## Accessibility & Responsiveness

**Mobile Adaptations:**
- Stack dashboard cards vertically (grid-cols-1)
- Make tables horizontally scrollable (overflow-x-auto)
- Full-width buttons on forms
- Collapsible navigation to hamburger menu if space constrained

**Dark Mode:**
- Maintain all color specifications for dark mode
- Ensure all form inputs have proper dark backgrounds (bg-slate-700)
- Border contrast maintained (use slate-600 for borders)

**Focus Management:**
- Clear focus indicators on all interactive elements
- Logical tab order through forms
- Keyboard shortcuts for common actions (consider Cmd/Ctrl+K for search if added later)

---

## Data Visualization

**Number Formatting:**
- Currency: Always show 2 decimal places with ₺ symbol
- Large numbers: Consider thousand separators for readability
- Negative values: Show in red for expenses/losses

**Empty States:**
- Centered message with helpful text
- Suggest next action ("Add your first sale to get started")
- Light gray text (text-slate-400)

This design creates a professional, efficient workspace optimized for daily restaurant management tasks while maintaining visual clarity and ease of use.