# POS V2 Implementation Plan

**Branch:** dev  
**Start Date:** 2026-03-12  
**Model:** MiniMax Starter (100 prompts / 5 hours)

---

## Session Planning

**Strategy:** 
- Break into small, independent tasks
- Each task = 1 session = ~20 prompts max
- Create files locally first, then batch commit
- Use exec for file operations (cheaper than read/write calls)

---

## Implementation Checklist

### ✅ Session 1: Phase 0 - Duplicate POS (DONE)

**Status:** Already done (created dev branch)

---

### Session 2: Phase 1.1 - Create Directory Structure

**Prompts estimate:** 3-5

- [ ] Create directory: `erpnext/accounts/page/pos_v2/`
- [ ] Create directory: `erpnext/public/js/pos_v2/`
- [ ] Create directory: `erpnext/public/css/pos_v2/`
- [ ] Create `__init__.py` (empty)

**Commands:**
```bash
mkdir -p /root/.openclaw/workspace/sourceCode/erpnext/erpnext/accounts/page/pos_v2
mkdir -p /root/.openclaw/workspace/sourceCode/erpnext/erpnext/public/js/pos_v2
mkdir -p /root/.openclaw/workspace/sourceCode/erpnext/erpnext/public/css/pos_v2
touch /root/.openclaw/workspace/sourceCode/erpnext/erpnext/accounts/page/pos_v2/__init__.py
```

---

### Session 3: Phase 1.2 - Create pos_v2.json

**Prompts estimate:** 2-3

- [ ] Create `pos_v2.json` - Page metadata

**File:** `erpnext/accounts/page/pos_v2/pos_v2.json`
```json
{
 "content": null, 
 "creation": "2026-03-12T00:00:00.000000", 
 "docstatus": 0, 
 "doctype": "Page", 
 "icon": "fa fa-th", 
 "modified": "2026-03-12T00:00:00.000000", 
 "modified_by": "Administrator", 
 "module": "Accounts", 
 "name": "pos-v2", 
 "owner": "Administrator", 
 "page_name": "pos-v2", 
 "roles": [
  {"role": "Sales User"},
  {"role": "Purchase User"},
  {"role": "Accounts User"}
 ], 
 "script": null, 
 "standard": "Yes", 
 "style": null, 
 "title": "POS V2"
}
```

---

### Session 4: Phase 1.3 - Create pos_v2.js (Basic)

**Prompts estimate:** 3-4

- [ ] Create `pos_v2.js` with page loader
- [ ] Include pos.js via `{% include %}`
- [ ] Test page loads at `/desk#pos-v2`

**File:** `erpnext/accounts/page/pos_v2/pos_v2.js`
```javascript
frappe.provide("erpnext.pos");
{% include "erpnext/public/js/controllers/taxes_and_totals.js" %}
{% include "erpnext/accounts/page/pos/pos.js" %}

frappe.pages['pos-v2'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __('Point of Sale V2'),
		single_column: true
	});

	frappe.db.get_value('POS Settings', {name: 'POS Settings'}, 'is_online', (r) => {
		if (r && r.use_pos_in_offline_mode && cint(r.use_pos_in_offline_mode)) {
			wrapper.pos = new erpnext.pos.PointOfSale(wrapper);
			cur_pos = wrapper.pos;
		} else {
			frappe.set_route('point-of-sale');
		}
	});
}

frappe.pages['pos-v2'].refresh = function (wrapper) {
	window.onbeforeunload = function () {
		return wrapper.pos.beforeunload()
	}
}
```

---

### Session 5: Phase 1.4 - CSS Variables

**Prompts estimate:** 2-3

- [ ] Create `variables.css`
- [ ] Define all CSS variables for pharmacy theme

**File:** `erpnext/public/css/pos_v2/variables.css`

```css
:root {
  /* Primary Colors */
  --pos-primary-blue: #2563eb;
  --pos-primary-green: #059669;
  --pos-primary-white: #ffffff;
  --pos-background: #f8fafc;
  
  /* Semantic Colors */
  --pos-success: #10b981;
  --pos-warning: #f59e0b;
  --pos-danger: #ef4444;
  --pos-info: #3b82f6;
  
  /* Text Colors */
  --pos-text-primary: #1e293b;
  --pos-text-secondary: #64748b;
  --pos-text-muted: #94a3b8;
  --pos-text-inverse: #ffffff;
  
  /* UI Colors */
  --pos-border: #e2e8f0;
  --pos-hover: #f1f5f9;
  --pos-selected: #dbeafe;
  --pos-disabled: #cbd5e1;
  
  /* Font Sizes */
  --pos-text-xs: 11px;
  --pos-text-sm: 13px;
  --pos-text-base: 15px;
  --pos-text-lg: 17px;
  --pos-text-xl: 20px;
  --pos-text-2xl: 24px;
  
  /* Spacing */
  --pos-space-1: 4px;
  --pos-space-2: 8px;
  --pos-space-3: 12px;
  --pos-space-4: 16px;
  --pos-space-5: 20px;
  --pos-space-6: 24px;
  
  /* Border Radius */
  --pos-radius-sm: 4px;
  --pos-radius-md: 8px;
  --pos-radius-lg: 12px;
  
  /* Shadows */
  --pos-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --pos-shadow-md: 0 4px 6px rgba(0,0,0,0.07);
}
```

---

### Session 6: Phase 1.5 - Layout CSS & Template

**Prompts estimate:** 3-4

- [ ] Create `layout.css` - Basic layout styles
- [ ] Create `pos_v2_layout.html` - Main HTML structure

**File:** `erpnext/public/css/pos_v2/layout.css`

```css
.pos-v2-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--pos-background);
}

.pos-v2-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--pos-space-4);
  background: var(--pos-primary-white);
  border-bottom: 1px solid var(--pos-border);
}

.pos-v2-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.pos-v2-items-panel {
  flex: 0 0 60%;
  padding: var(--pos-space-4);
  overflow-y: auto;
}

.pos-v2-cart-panel {
  flex: 0 0 40%;
  background: var(--pos-primary-white);
  border-left: 1px solid var(--pos-border);
}
```

**File:** `erpnext/public/js/pos_v2/pos_v2_layout.html` - See Implementation Guide

---

### Session 7: Phase 1.6 - Modify pos_v2.js to Use New Layout

**Prompts estimate:** 3-4

- [ ] Copy full pos.js content to pos_v2.js
- [ ] Replace `frappe.pages['pos']` with `frappe.pages['pos-v2']`
- [ ] Replace template name from "pos" to "pos_v2_layout"
- [ ] Add localStorage override methods (`*_v2` keys)

---

### Session 8: Phase 1.7 - Update build.json

**Prompts estimate:** 2-3

- [ ] Add V2 templates to `build.json`
- [ ] Add V2 CSS to `build.json`

---

### Session 9-10: Phase 2 - Item Display

**Prompts estimate:** 5-6 per session

- [ ] Create `components.css` - Item card styles
- [ ] Create `pos_v2_item_card.html` - Item template
- [ ] Modify `make_item_list()` in pos_v2.js
- [ ] Add stock status logic
- [ ] Add expiry warning logic

---

### Session 11-12: Phase 3 - Shopping Cart

**Prompts estimate:** 5-6 per session

- [ ] Create `pos_v2_cart_item.html` - Cart template
- [ ] Modify `show_items_in_item_cart()` 
- [ ] Add quantity controls
- [ ] Add dosage info display
- [ ] Add remove item logic

---

### Session 13-14: Phase 4 - Patient Safety

**Prompts estimate:** 4-5 per session

- [ ] Add allergy alert system
- [ ] Add controlled drug (ขย.) handling
- [ ] Add visual badges
- [ ] Test safety features

---

### Session 15-16: Phase 5-6 - Polish

**Prompts estimate:** 4-5 per session

- [ ] Add animations CSS
- [ ] Add responsive CSS
- [ ] Testing checklist
- [ ] Bug fixes

---

## Commit Strategy

**Do NOT commit after each session!** Batch commits:

| Commit | Contents | Session |
|--------|----------|---------|
| 1 | Phase 0-1.4: Directories, json, basic js | 2-4 |
| 2 | Phase 1.5-1.7: CSS, Templates, build.json | 5-8 |
| 3 | Phase 2: Item Display | 9-10 |
| 4 | Phase 3: Cart | 11-12 |
| 5 | Phase 4: Safety Features | 13-14 |
| 6 | Phase 5-6: Polish & Deploy | 15-16 |

---

## Progress Tracking

| Phase | Session | Status |
|-------|---------|--------|
| Phase 0 | 1 | ✅ Done (branch dev) |
| Phase 1.1-1.4 | 2-4 | ⬜ Pending |
| Phase 1.5-1.7 | 5-8 | ⬜ Pending |
| Phase 2 | 9-10 | ⬜ Pending |
| Phase 3 | 11-12 | ⬜ Pending |
| Phase 4 | 13-14 | ⬜ Pending |
| Phase 5-6 | 15-16 | ⬜ Pending |

---

## Next Action

**Start with Session 2:** Create directory structure

Ready to begin?
