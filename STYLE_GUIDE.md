# 🎨 ShiftMind Style Guidelines - Implementation Guide

## 📋 Overview
This document outlines the complete style guidelines implementation for the ShiftMind project, ensuring consistent, accessible, and beautiful UI across all 8 stages.

## 🎯 Core Design Principles

### Color Palette
- **Primary**: `blue-500` (#3b82f6) - Main actions, links, primary buttons
- **Background**: `gray-50` (#f9fafb) - Page backgrounds 
- **Surface**: `white` - Card backgrounds, modals, inputs
- **Text Primary**: `gray-900` (#111827) - Main content
- **Text Secondary**: `gray-600` (#4b5563) - Descriptions, labels
- **Success**: `green-500` (#10b981) - Success states, confirmations
- **Warning**: `yellow-500` (#f59e0b) - Warnings, attention
- **Error**: `red-500` (#ef4444) - Errors, destructive actions

### Typography
- **Primary Font**: "Assistant" - Modern Hebrew font with excellent readability
- **Fallback**: "Open Sans Hebrew", "Open Sans", "Heebo", sans-serif
- **Font Weights**: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

## 🧱 Component Standards

### Cards & Surfaces
```css
/* Standard Card */
.card {
  @apply bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md;
}

/* Elevated Card */
.card-elevated {
  @apply bg-white rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl;
}
```

### Buttons
All buttons use `rounded-xl` and include focus states for accessibility:

```css
/* Primary Button */
.btn-primary {
  @apply bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold 
         hover:bg-blue-600 focus:bg-blue-600 focus:ring-2 focus:ring-blue-200 
         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Secondary Button */
.btn-secondary {
  @apply bg-gray-50 text-gray-700 px-6 py-2 rounded-xl font-semibold 
         hover:bg-gray-100 focus:bg-gray-100 focus:ring-2 focus:ring-gray-200 
         border border-gray-300 transition-all duration-200;
}
```

### Forms & Inputs
RTL-optimized with consistent styling:

```css
/* Primary Input */
.input-primary {
  @apply w-full px-4 py-3 border border-gray-300 rounded-xl 
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
         bg-white text-gray-900 placeholder-gray-500 transition-all duration-200;
}

/* Select with RTL Arrow */
.select-primary {
  @apply w-full px-4 py-3 border border-gray-300 rounded-xl 
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
         bg-white text-gray-900 transition-all duration-200 appearance-none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: left 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-left: 2.5rem;
}
```

## 🎭 Animations & Motion

### Framer Motion Integration
Used throughout for subtle, meaningful animations:

```typescript
// Page Header Animation
<motion.div 
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>

// Button Hover/Tap Animation
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>

// Modal Enter/Exit Animation
<motion.div 
  initial={{ opacity: 0, scale: 0.95, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
```

### CSS Animations
Fallback animations for non-framer-motion components:

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

## 🌐 RTL (Right-to-Left) Support

### Global RTL Configuration
```css
* {
  direction: rtl;
}

html, body {
  direction: rtl;
}

/* RTL Space Utilities */
.space-x-reverse > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 1;
}
```

### RTL-Specific Components
- Tables: `text-right` alignment for headers
- Toasts: Positioned `right-4` instead of `left-4`  
- Modals: Proper RTL text flow and button placement
- Forms: Input icons positioned appropriately for RTL
- Navigation: Menu items flow right-to-left

## ♿ Accessibility Standards

### Focus States
All interactive elements have clear focus indicators:
```css
*:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Component-specific focus rings */
focus:ring-2 focus:ring-blue-200
```

### Color Contrast
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- High contrast mode support

### Keyboard Navigation
- Tab order follows logical flow (RTL-aware)
- Enter/Space activation for buttons
- Escape key closes modals
- Arrow keys for navigation when appropriate

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

/* Adaptive Layouts */
.grid-auto {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4;
}
```

### Mobile Optimizations
- Touch-friendly button sizes (minimum 44px)
- Proper viewport meta tag
- Responsive typography scaling
- Mobile-friendly modals and overlays

## 🧩 Component Library Usage

### Implemented Components
1. **PageHeader**: Animated page headers with title, description, and action buttons
2. **DataCard**: Table component with search, pagination, and actions
3. **Modal**: Animated modals with backdrop and escape handling
4. **Toast**: RTL-positioned notifications with animations
5. **ProgressBar**: Animated progress indicators
6. **Slider**: Custom range inputs with color coding
7. **Sparkline**: Mini charts for data visualization
8. **BarChart**: Full bar charts with hover states

### Component Naming Convention
- Use PascalCase for component names
- Prefix with purpose: `PageHeader`, `DataCard`, `ScheduleBoard`
- Suffix variants: `ButtonPrimary`, `InputSecondary`

## 🎨 Implementation Checklist

### ✅ Completed Features
- [x] Consistent color palette (blue-500 primary)
- [x] Assistant font implementation
- [x] rounded-2xl components throughout
- [x] Soft shadows with hover states
- [x] Framer-motion subtle transitions
- [x] Full RTL support (tables, inputs, dialogs)
- [x] Accessible focus states
- [x] Readable contrast ratios
- [x] Responsive design patterns
- [x] Animation consistency
- [x] Typography hierarchy

### 🚀 Stage-by-Stage Implementation
- **Stage 0**: Base layout with RTL and navigation
- **Stage 1**: Auth screen with gradient design
- **Stage 2**: Dashboard with welcome cards
- **Stage 3**: CRUD pages with DataCard component
- **Stage 4**: Import Wizard with progress tracking
- **Stage 5**: Seasonal Profiles with sliders
- **Stage 6**: AI Forecast with charts and metrics
- **Stage 7**: Automations with toggle controls
- **Stage 8**: Schedule Board with drag-and-drop

## 📝 Usage Examples

### Creating a New Page
```typescript
import { motion } from 'framer-motion';
import { PageHeader } from '../components/ui/PageHeader';

function NewPage() {
  return (
    <motion.div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" 
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <PageHeader
        title="כותרת הדף"
        description="תיאור הדף"
        onAddNew={() => {}}
        addButtonText="הוסף חדש"
      />
      
      <div className="card p-6">
        {/* Page content */}
      </div>
    </motion.div>
  );
}
```

### Using Consistent Buttons
```typescript
// Primary action
<button className="btn-primary">
  שמור שינויים
</button>

// Secondary action  
<button className="btn-secondary">
  ביטול
</button>

// With Framer Motion
<motion.button 
  className="btn-primary"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  פעולה מונפשת
</motion.button>
```

## 🎯 Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Framer-motion animations only when needed
2. **CSS Classes**: Pre-defined utility classes for common patterns
3. **Minimal Animations**: Subtle effects that don't impact performance
4. **Efficient Selectors**: Avoid deep nesting in CSS
5. **Font Optimization**: Preload critical fonts

### Bundle Size Management
- Tree-shake unused Framer Motion features
- Use CSS animations for simple effects
- Optimize font loading with `font-display: swap`

---

## ✨ Final Notes

This style guide ensures **consistency**, **accessibility**, and **beautiful user experience** across the entire ShiftMind application. All 8 stages implement these guidelines uniformly, creating a cohesive, production-ready interface that works seamlessly in Hebrew RTL layout.

The implementation prioritizes:
- **User Experience**: Smooth, intuitive interactions
- **Accessibility**: WCAG compliance for all users  
- **Performance**: Optimized animations and loading
- **Maintainability**: Clear, reusable component patterns
- **Scalability**: Easy to extend and modify
