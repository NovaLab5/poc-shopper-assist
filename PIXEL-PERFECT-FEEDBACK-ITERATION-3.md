# PIXEL-PERFECT DESIGN FEEDBACK - Iteration 3
**Date:** 2026-01-29 5:55 PM PST  
**Reviewer:** Razor (Acting CTO)  
**Method:** Side-by-side comparison of Figma vs. Live App

---

## ⚠️ IMPORTANT NOTE

The Figma frame exported (node `417:40232`) appears to be an older/different version than what's implemented in the app. 

**Figma shows:**
- Simple "Welcome" heading
- "Sweet Dill is a completely independent app" text
- Minimal content

**App shows:**
- "Welcome to Sweet Dill" heading
- "Your AI shopping assistant" subtitle
- Description text
- 3 feature cards (Chat, Collections, Tracking)

**Action needed:** Verify correct Figma frame reference or proceed with best-practices design review.

---

## 📐 ONBOARDING SCREEN 1 - Detailed Measurements

### Current App Implementation

#### Phone Mockup Frame
- ✅ **Outer dimensions:** ~320px W × ~650px H
- ✅ **Frame color:** Dark charcoal (#2D2D2D)
- ✅ **Border radius:** ~40px
- ✅ **Notch:** Pill-shaped, ~80px W × ~25px H
- ⚠️ **Frame thickness:** ~12-14px (verify against Figma)

#### Avatar/Logo
- ✅ **Size:** ~70px diameter
- ✅ **Border:** Light green ring, ~4px thick
- ✅ **Position:** Centered, ~30px from top
- ⚠️ **Shadow:** Present but verify intensity

#### Typography - "Welcome to Sweet Dill"
- **Current:** ~24-26px, Bold (700), #1A1A1A
- ⚠️ **Needs verification:** Font size could be 22px or 28px in Figma
- ⚠️ **Color:** Might need to be exact hex from Figma

#### Typography - "Your AI shopping assistant"
- **Current:** ~16-17px, Regular/Medium (400-500), Green (#7CB342)
- ⚠️ **Needs verification:** Font weight and exact green hex

#### Typography - Description Text
- **Current:** ~14px, Medium gray (#666)
- ⚠️ **Line height:** Appears ~22px, verify against Figma
- ⚠️ **Letter spacing:** May need adjustment

#### Feature Cards
**Card Container:**
- **Current dimensions:** Approximately full-width minus 32px padding
- **Card height:** ~100-110px each
- **Background:** White with subtle border/shadow
- **Border radius:** ~12px
- **Spacing between cards:** ~16px

**Icon Circle:**
- **Size:** ~44px diameter
- **Background:** Light green tint (#F0F7EC or similar)
- **Position:** Left side, vertically centered

**Icon:**
- **Size:** ~20-22px
- **Color:** Green (#8BC34A)

**Card Title:**
- **Font size:** ~15-16px
- **Font weight:** Semibold (600)
- **Color:** Dark (#2D2D2D)

**Card Description:**
- **Font size:** ~13-14px
- **Font weight:** Regular (400)
- **Color:** Medium gray (#666)
- **Line height:** ~20px

#### Progress Dots
- **Active dot:** ~8px wide, Green (#8BC34A)
- **Inactive dot:** ~6px diameter, Light gray (#D1D5DB)
- **Spacing:** ~8px between dots

#### "Next" Button
- **Height:** ~56px
- **Width:** Full-width with ~24px side margins (max-width ~400px)
- **Border radius:** Full rounded pill (~28px)
- **Background:** Green gradient or solid (#8BC34A)
- **Text:** ~16px, Semibold (600), White
- **Icon:** Chevron-right, ~20px

---

## 🎨 DESIGN ISSUES FOUND & FIXES NEEDED

### Priority 1: CRITICAL - Typography Precision

**Issue 1.1: Font Sizes May Not Match Figma**
**Current state:** Using approximate sizes (24-26px, 16-17px, 14px)
**Required:** Extract EXACT font sizes from Figma

**Fix for Codex:**
```tsx
// src/pages/Onboarding.tsx - Line ~90

// BEFORE (approximate):
<h1 className="text-[22px] font-semibold text-foreground mb-2">

// AFTER (exact Figma values - REPLACE WITH ACTUAL FIGMA MEASUREMENTS):
<h1 className="text-[28px] font-bold text-[#2D3748] mb-2 leading-[34px] tracking-[-0.02em]">
  {step.title}
</h1>

// Subtitle:
// BEFORE:
<p className="text-[15px] text-primary font-medium">{step.subtitle}</p>

// AFTER:
<p className="text-[16px] text-[#8BC34A] font-medium leading-[22px]">
  {step.subtitle}
</p>
```

**Measurements needed from Figma:**
- Main heading: font-size, line-height, letter-spacing, color (hex)
- Subtitle: font-size, line-height, color (hex)
- Description: font-size, line-height, letter-spacing
- Card titles: font-size, font-weight, color
- Card descriptions: font-size, line-height, color

---

### Priority 2: MEDIUM - Spacing Precision

**Issue 2.1: Card Spacing May Be Off**
**Current:** ~16px between cards (estimated)
**Required:** Exact spacing from Figma

**Fix for Codex:**
```tsx
// src/pages/Onboarding.tsx - Line ~100

// BEFORE:
<div className="space-y-4">

// AFTER (verify exact spacing):
<div className="space-y-5"> {/* or space-y-6 if 24px in Figma */}
  {step.features?.map((feature, idx) => (
    <Card key={idx} className="border border-border/60 shadow-sm">
```

**Measurements needed:**
- Space between logo and title
- Space between title and subtitle  
- Space between subtitle and description
- Space between description and first card
- Space between cards
- Padding inside cards

---

### Priority 3: MEDIUM - Color Precision

**Issue 3.1: Colors May Not Be Exact Brand Colors**
**Current:** Using Tailwind defaults (primary, muted, etc.)
**Required:** Exact hex values from Figma

**Fix for Codex:**
```tsx
// Update all color references to exact hex values

// Example for card text:
// BEFORE:
<h3 className="text-[15px] font-semibold text-foreground mb-1">

// AFTER:
<h3 className="text-[15px] font-semibold text-[#1F2937] mb-1">
  {feature.title}
</h3>

<p className="text-[13px] leading-5 text-muted-foreground">
// AFTER:
<p className="text-[13px] leading-5 text-[#6B7280]">
  {feature.description}
</p>
```

**Colors needed from Figma:**
- Primary green (buttons, accents): Current #8BC34A, verify
- Heading text: Current #1A1A1A, verify
- Body text gray: Current #666, verify
- Subtitle green: Current #7CB342, verify
- Card background: Verify if pure white or tinted
- Icon circle background: Verify exact tint

---

### Priority 4: LOW - Component Details

**Issue 4.1: Icon Sizes**
**Current:** ~20-22px icons
**Required:** Verify against Figma

**Fix:**
```tsx
// src/pages/Onboarding.tsx

<feature.icon className="w-5 h-5 text-primary" />
// Verify if should be w-6 h-6 (24px) instead
```

**Issue 4.2: Card Border/Shadow**
**Current:** `border border-border/60 shadow-sm`
**Required:** Verify exact border color, width, shadow spread

**Fix:**
```tsx
// BEFORE:
<Card key={idx} className="border border-border/60 shadow-sm">

// AFTER (example - verify):
<Card key={idx} className="border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
```

---

## 🔍 WHAT I NEED FROM FIGMA

To make this pixel-perfect, I need these exact measurements extracted from **Frame 1000011424**:

### Typography
- [ ] H1 "Welcome to Sweet Dill": font-size, line-height, font-weight, letter-spacing, color (hex)
- [ ] Subtitle: font-size, line-height, font-weight, color (hex)
- [ ] Description: font-size, line-height, letter-spacing, color (hex)
- [ ] Card titles: font-size, font-weight, color (hex)
- [ ] Card descriptions: font-size, line-height, color (hex)

### Spacing
- [ ] Logo top margin
- [ ] Logo to title gap
- [ ] Title to subtitle gap
- [ ] Subtitle to description gap
- [ ] Description to cards gap
- [ ] Between cards gap
- [ ] Card internal padding (top, left, right, bottom)

### Colors (All as Hex)
- [ ] Primary green (buttons)
- [ ] Heading color
- [ ] Subtitle color
- [ ] Description color
- [ ] Card background
- [ ] Card border
- [ ] Icon circle background

### Sizes
- [ ] Avatar/logo diameter
- [ ] Avatar border thickness and color
- [ ] Icon circle diameter
- [ ] Icon size
- [ ] Card height (or auto with padding)
- [ ] Button height
- [ ] Progress dot sizes (active/inactive)

---

## 🎯 RECOMMENDED APPROACH

Since I don't have the exact Figma measurements yet, here's the approach:

### Option A: Manual Extraction (Recommended)
1. Open Figma Frame 1000011424
2. Use Figma's inspect panel to get exact measurements
3. Create a spec document with all values
4. I'll convert to exact Tailwind classes
5. Codex implements with precision

### Option B: Best Practices Polish (Current)
1. Proceed with design best practices
2. Ensure visual hierarchy is clear
3. Use consistent spacing scale (4px, 8px, 12px, 16px, 24px, 32px)
4. Verify colors match brand
5. Polish can be refined later with exact specs

### Option C: Figma Plugin Export
1. Use Figma "Inspect" or design tokens plugin
2. Export CSS variables or design tokens
3. Convert to Tailwind config
4. Apply systematically

---

## 📋 IMMEDIATE ACTIONS FOR CODEX

**Even without exact Figma specs, make these improvements:**

### 1. Standardize Spacing Scale
```tsx
// Use consistent spacing (Tailwind default scale)
// 4px = 1, 8px = 2, 12px = 3, 16px = 4, 20px = 5, 24px = 6, 32px = 8

// Between major sections: 24px (space-y-6) or 32px (space-y-8)
// Between cards: 16px (space-y-4) or 20px (space-y-5)
// Inside cards: 20px (p-5) or 24px (p-6)
```

### 2. Improve Typography Hierarchy
```tsx
// Ensure clear size differences:
// H1: 28px (text-[28px]) - Main heading
// H2: 20px (text-xl) - Section headings  
// H3: 16px (text-base) - Card titles
// Body: 14px (text-sm) - Descriptions
// Small: 13px (text-[13px]) - Fine print
```

### 3. Verify Color Contrast (WCAG AA)
```tsx
// Ensure text is readable:
// Dark on white: Minimum 4.5:1 ratio
// Check current colors pass accessibility standards
```

### 4. Polish Button
```tsx
// Ensure button is prominent:
<Button className="w-full max-w-md h-14 rounded-full text-base font-semibold">
```

---

## ✅ SIGN-OFF CRITERIA

Before marking onboarding screen as pixel-perfect:
- [ ] All font sizes match Figma (±1px acceptable)
- [ ] All spacing matches Figma (±2px acceptable)
- [ ] All colors match Figma exactly (hex values)
- [ ] Icon sizes match Figma
- [ ] Card shadows/borders match Figma
- [ ] Button styling matches Figma
- [ ] Progress dots match Figma
- [ ] Phone mockup frame matches Figma (if applicable)
- [ ] No visual regressions on mobile widths (375px, 390px, 428px)

---

**Next Steps:**
1. ✅ Get exact Figma measurements for Frame 1000011424
2. 🔄 Apply precise values to Onboarding.tsx
3. 🔄 Repeat for Frame 1000011425 (screen 2)
4. 🔄 Repeat for Chat, Product Page, etc.

**Reviewer:** Razor 🥷  
**Status:** Awaiting exact Figma measurements OR proceeding with best-practices polish
