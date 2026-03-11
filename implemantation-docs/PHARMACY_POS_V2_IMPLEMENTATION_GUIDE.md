# Pharmacy POS V2 - Complete Implementation Guide

**Project:** Pharmacy POS Redesign - From Duplication to Deployment  
**Version:** 2.0  
**Date:** 2026-03-11  
**Status:** Implementation Ready

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Phase 0: Duplicate POS to POS V2](#phase-0-duplicate-pos-to-pos-v2)
4. [Phase 1: Foundation Setup](#phase-1-foundation-setup)
5. [Phase 2: Item Display Redesign](#phase-2-item-display-redesign)
6. [Phase 3: Shopping Cart Redesign](#phase-3-shopping-cart-redesign)
7. [Phase 4: Patient Safety Features](#phase-4-patient-safety-features)
8. [Phase 5: Workflow Optimization](#phase-5-workflow-optimization)
9. [Phase 6: Polish & Testing](#phase-6-polish--testing)
10. [Deployment Strategy](#deployment-strategy)
11. [Progress Tracking](#progress-tracking)

---

## Project Overview

### Goal
Transform the current POS into a modern, pharmacy-specific point of sale system with:
- Professional medical-grade UI
- Enhanced patient safety features
- Streamlined pharmacy workflows
- Better drug information display
- All existing functionality preserved

### Approach
1. **Duplicate** current POS to POS V2 (keep both running)
2. **Redesign** POS V2 with new UI/UX
3. **Test** thoroughly without affecting production
4. **Deploy** gradually with easy rollback

### Key Constraints
- ✅ One small server-side change: added `is_drug_allergy, drug_allergy_detail` to customer query
- ✅ Must maintain offline functionality
- ✅ Must preserve all existing features
- ✅ Must be backward compatible

---

## Prerequisites

### Required Knowledge
- JavaScript (ES5/ES6)
- HTML/CSS
- Underscore.js templating
- ERPNext/Frappe framework basics
- Bootstrap 3 grid system

### Development Environment
```bash
# ERPNext installation
cd /path/to/erpnext

# Verify bench
bench --version

# Verify site
bench --site [your-site] console
```

### Tools Needed
- Code editor (VS Code recommended)
- Browser DevTools
- Git (for version control)
- Figma (optional, for mockups)

### Backup Current System
```bash
# Backup database
bench --site [your-site] backup

# Backup files
cp -r erpnext/accounts/page/pos erpnext/accounts/page/pos.backup
cp -r erpnext/public/js/pos erpnext/public/js/pos.backup
```

---

## ⚠️ Critical Issues & Corrections

> **These issues were found during code verification and MUST be addressed for the implementation to work.**

### Issue 1: Customer Allergy Data — ✅ FIXED

**Problem:** The `get_customers_list()` query in `pos.py` did not return `is_drug_allergy` or `drug_allergy_detail`.

**Fix Applied:** Added two fields to the SQL query in `erpnext/accounts/doctype/sales_invoice/pos.py`:

```python
# Line 180 - get_customers_list()
# Before:
select name, customer_name, customer_group, territory, customer_pos_id

# After:
select name, customer_name, customer_group, territory, customer_pos_id, is_drug_allergy, drug_allergy_detail
```

**Result:** Allergy data is now available in `this.customers` array for all customers.

---

### Issue 2: Templates Must Be Registered in build.json

**Problem:** `frappe.render_template("template_name", data)` only works for templates registered in `erpnext/public/build.json`. New templates will NOT be found unless added there.

**Current build.json includes:**
```json
"js/erpnext.min.js": [
    "public/js/pos/pos.html",
    "public/js/pos/pos_bill_item.html",
    "public/js/pos/pos_bill_item_new.html",
    "public/js/pos/pos_selected_item.html",
    "public/js/pos/pos_item.html",
    "public/js/pos/pos_tax_row.html",
    "public/js/pos/customer_toolbar.html",
    "public/js/pos/pos_invoice_list.html",
    "public/js/pos/pos_item_usage.html"
]
```

**Fix Required:** Add ALL new V2 templates to `build.json`:
```json
"js/erpnext.min.js": [
    ... existing entries ...,
    "public/js/pos_v2/pos_v2_layout.html",
    "public/js/pos_v2/pos_v2_item_card.html",
    "public/js/pos_v2/pos_v2_cart_item.html",
    "public/js/pos_v2/pos_v2_payment_panel.html"
]
```

Then run `bench build` to rebuild assets.

---

### Issue 3: CSS Loading Method

**Problem:** The guide uses `frappe.dom.set_style` with `@import` which is unreliable. CSS files in `erpnext/public/css/` are NOT automatically loaded.

**Fix:** Two options:

**Option A: Add to build.json (Recommended)**
```json
"css/erpnext.css": [
    "public/css/erpnext.css",
    "public/css/pos_v2/variables.css",
    "public/css/pos_v2/layout.css",
    "public/css/pos_v2/components.css",
    "public/css/pos_v2/animations.css",
    "public/css/pos_v2/responsive.css"
]
```

**Option B: Inline CSS in pos_v2.js**
```javascript
frappe.pages['pos-v2'].on_page_load = function (wrapper) {
    frappe.dom.set_style(`
        /* Paste all CSS variables and styles here */
        :root {
            --pos-primary-blue: #2563eb;
            ...
        }
    `);
}
```

**Option C: Use frappe.require**
```javascript
frappe.require('/assets/erpnext/css/pos_v2/variables.css');
```

---

### Issue 4: localStorage Key Conflict

**Problem:** Both POS and POS V2 use the same localStorage key `sales_invoice_doc`. If both are open simultaneously, they will overwrite each other's data.

**Impact:** Invoices created in POS V2 could be lost or mixed with POS invoices.

**Fix:** Override localStorage methods in `PointOfSaleV2`:
```javascript
erpnext.pos.PointOfSaleV2 = erpnext.pos.PointOfSale.extend({
    get_doc_from_localstorage: function () {
        try {
            return JSON.parse(localStorage.getItem('sales_invoice_doc_v2')) || [];
        } catch (e) {
            return []
        }
    },

    update_localstorage: function () {
        try {
            localStorage.setItem('sales_invoice_doc_v2', JSON.stringify(this.si_docs));
        } catch (e) {
            frappe.throw(__("LocalStorage is full, did not save"))
        }
    },

    update_email_queue: function () {
        try {
            localStorage.setItem('email_queue_v2', JSON.stringify(this.email_queue));
        } catch (e) {
            frappe.throw(__("LocalStorage is full, did not save"))
        }
    },

    get_email_queue: function () {
        try {
            return JSON.parse(localStorage.getItem('email_queue_v2')) || {};
        } catch (e) {
            return {}
        }
    },

    get_customers_details: function () {
        try {
            return JSON.parse(localStorage.getItem('customer_details_v2')) || {};
        } catch (e) {
            return {}
        }
    },

    update_customer_in_localstorage: function() {
        try {
            localStorage.setItem('customer_details_v2', JSON.stringify(this.customer_details));
        } catch (e) {
            frappe.throw(__("LocalStorage is full, did not save"))
        }
    }
});
```

---

### Issue 5: Class Inheritance Chain

**Problem:** The guide shows `erpnext.pos.PointOfSale.extend({})` but the actual inheritance chain is:

```
frappe.ui.form.Controller (base)
    → erpnext.stock.StockController
        → erpnext.payments
            → erpnext.taxes_and_totals
                → erpnext.pos.PointOfSale
```

`PointOfSale` is defined in `pos.js` which is loaded per-page (not in `erpnext.min.js`). The class only exists after the original POS page loads it.

**Fix:** The `pos_v2.js` must include the same `{% include %}` directive AND the class definition must happen AFTER the include:

```javascript
frappe.provide("erpnext.pos");
{% include "erpnext/public/js/controllers/taxes_and_totals.js" %}

// The PointOfSale class from pos.js is NOT available here
// because pos.js is only loaded for the /pos page.
// 
// Two options:
// Option A: Include the entire pos.js (recommended for Phase 0)
{% include "erpnext/accounts/page/pos/pos.js" %}

// Option B: Copy the full PointOfSale class into pos_v2.js
// (recommended for later phases when you diverge significantly)
```

**For Phase 0 (exact duplicate), use Option A:**
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

**For later phases (when extending), use Option B:**
Copy the entire `PointOfSale` class into `pos_v2.js` and rename to `PointOfSaleV2`, then modify directly. This avoids inheritance complexity.

---

### Issue 6: `_super()` Usage — RESOLVED

**Problem:** Using `_super()` requires proper `.extend()` inheritance chain.

**Resolution:** We chose the "copy full class" approach (Option B in Issue 5), so `_super()` is not used anywhere in the implementation. All methods are modified directly in the copied code.

---

### Summary of Required Changes to Implementation Guide

| Issue | Severity | Phase Affected | Action |
|-------|----------|----------------|--------|
| 1. Customer allergy data | ✅ Fixed | pos.py | Added 2 fields to SQL query |
| 2. build.json registration | 🔴 High | Phase 1-3 | Add templates to build.json |
| 3. CSS loading | 🟡 Medium | Phase 1 | Use build.json or inline CSS |
| 4. localStorage conflict | 🟡 Medium | Phase 0 | Override localStorage keys |
| 5. Class inheritance | 🔴 High | Phase 0 | Use `{% include %}` for pos.js |
| 6. _super() usage | ✅ Resolved | - | Using copy approach, not extend |

---

**Duration:** 1 hour  
**Goal:** Create working POS V2 accessible at `/desk#pos-v2`

### Step 0.1: Create Directory Structure

```bash
cd erpnext/accounts/page/
mkdir pos_v2
cd pos_v2
```

### Step 0.2: Create Files

**File 1: `__init__.py`**
```bash
touch __init__.py
# Leave empty
```

**File 2: `pos_v2.json`**
```json
{
 "content": null, 
 "creation": "2026-03-11 23:00:00.000000", 
 "docstatus": 0, 
 "doctype": "Page", 
 "icon": "fa fa-th", 
 "modified": "2026-03-11 23:00:00.000000", 
 "modified_by": "Administrator", 
 "module": "Accounts", 
 "name": "pos-v2", 
 "owner": "Administrator", 
 "page_name": "pos-v2", 
 "roles": [
  {
   "role": "Sales User"
  }, 
  {
   "role": "Purchase User"
  }, 
  {
   "role": "Accounts User"
  }
 ], 
 "script": null, 
 "standard": "Yes", 
 "style": null, 
 "title": "POS V2"
}
```

**File 3: `pos_v2.js`**
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
			// offline
			wrapper.pos = new erpnext.pos.PointOfSale(wrapper);
			cur_pos = wrapper.pos;
		} else {
			// online
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

> **Note:** The `{% include "erpnext/accounts/page/pos/pos.js" %}` is critical. Without it, the `erpnext.pos.PointOfSale` class does not exist on this page. See [Issue 5](#issue-5-class-inheritance-chain) for details.

### Step 0.3: Import to Database

```bash
bench --site [your-site] console
```

```python
import frappe

# Create Page document
page = frappe.get_doc({
    "doctype": "Page",
    "name": "pos-v2",
    "page_name": "pos-v2",
    "title": "POS V2",
    "module": "Accounts",
    "standard": "Yes",
    "icon": "fa fa-th"
})

# Add roles
page.append("roles", {"role": "Sales User"})
page.append("roles", {"role": "Purchase User"})
page.append("roles", {"role": "Accounts User"})

page.insert(ignore_if_duplicate=True)
frappe.db.commit()

print("✅ POS V2 page created successfully!")
```

### Step 0.4: Clear Cache & Test

```bash
bench clear-cache
bench restart
```

**Test:**
1. Open browser: `http://your-site/desk#pos-v2`
2. Should see identical POS interface
3. Test basic functionality (add item, create invoice)

### Step 0.5: Verify Both POS Work

**Original POS:** `http://your-site/desk#pos`  
**New POS V2:** `http://your-site/desk#pos-v2`

Both should work independently.

### ✅ Phase 0 Checklist

- [ ] Directory created: `erpnext/accounts/page/pos_v2/`
- [ ] Files created: `__init__.py`, `pos_v2.json`, `pos_v2.js`
- [ ] Page imported to database
- [ ] Cache cleared
- [ ] POS V2 accessible at `/desk#pos-v2`
- [ ] Both POS versions working
- [ ] Basic functionality tested

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## Phase 1: Foundation Setup

**Duration:** 1-2 weeks  
**Goal:** Set up new layout structure and styling system

### Current Status: ⬜ Not Started

### Overview
Create the foundation for the new design:
- New CSS variables and color scheme
- New layout structure (2-column)
- Base component styles
- Typography system

### Step 1.1: Create CSS File Structure

```bash
cd erpnext/public/css/
mkdir pos_v2
cd pos_v2
```

Create files:
```bash
touch variables.css      # CSS variables
touch layout.css         # Layout styles
touch components.css     # Component styles
touch animations.css     # Animations
touch responsive.css     # Media queries
```

### Step 1.2: Define CSS Variables

**File: `erpnext/public/css/pos_v2/variables.css`**

```css
/* Pharmacy POS V2 - CSS Variables */

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
  --pos-text-3xl: 30px;
  
  /* Font Weights */
  --pos-font-normal: 400;
  --pos-font-medium: 500;
  --pos-font-semibold: 600;
  --pos-font-bold: 700;
  
  /* Spacing */
  --pos-space-1: 4px;
  --pos-space-2: 8px;
  --pos-space-3: 12px;
  --pos-space-4: 16px;
  --pos-space-5: 20px;
  --pos-space-6: 24px;
  --pos-space-8: 32px;
  --pos-space-10: 40px;
  
  /* Border Radius */
  --pos-radius-sm: 4px;
  --pos-radius-md: 8px;
  --pos-radius-lg: 12px;
  --pos-radius-full: 9999px;
  
  /* Shadows */
  --pos-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --pos-shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --pos-shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --pos-shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
  
  /* Transitions */
  --pos-transition: all 0.2s ease;
}
```

### Step 1.3: Create Base Layout

**File: `erpnext/public/css/pos_v2/layout.css`**

```css
/* Pharmacy POS V2 - Layout */

/* Main Container */
.pos-v2-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--pos-background);
  font-family: 'Sarabun', 'Inter', -apple-system, sans-serif;
  color: var(--pos-text-primary);
}

/* Header */
.pos-v2-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--pos-space-4);
  background: var(--pos-primary-white);
  border-bottom: 1px solid var(--pos-border);
  box-shadow: var(--pos-shadow-sm);
  z-index: 100;
}

/* Alert Banner */
.pos-v2-alert-banner {
  padding: var(--pos-space-4);
  background: #fee2e2;
  border-left: 4px solid var(--pos-danger);
  animation: slideDown 0.3s ease;
}

/* Main Content */
.pos-v2-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Left Panel - Items (60%) */
.pos-v2-items-panel {
  flex: 0 0 60%;
  display: flex;
  flex-direction: column;
  padding: var(--pos-space-4);
  overflow-y: auto;
}

/* Right Panel - Cart (40%) */
.pos-v2-cart-panel {
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
  background: var(--pos-primary-white);
  border-left: 1px solid var(--pos-border);
  box-shadow: var(--pos-shadow-md);
}

/* Footer */
.pos-v2-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--pos-space-3) var(--pos-space-4);
  background: var(--pos-primary-white);
  border-top: 1px solid var(--pos-border);
  font-size: var(--pos-text-sm);
  color: var(--pos-text-secondary);
}
```



### Step 1.4: Create New Layout Template

**File: `erpnext/public/js/pos_v2/pos_v2_layout.html`**

Create directory first:
```bash
mkdir -p erpnext/public/js/pos_v2
```

```html
<!-- Pharmacy POS V2 - Main Layout -->
<div class="pos-v2-container">
    
    <!-- Header -->
    <div class="pos-v2-header">
        <div class="pos-v2-header-left">
            <h3 style="margin: 0;">🏥 บ้านยายิ้ม POS V2</h3>
        </div>
        <div class="pos-v2-header-center">
            {% if (customer) { %}
            <div class="pos-v2-customer-info">
                <strong>{{ customer }}</strong>
                {% if (is_drug_allergy) { %}
                <span class="pos-v2-badge pos-v2-badge-danger">🔴 แพ้ยา</span>
                {% } %}
            </div>
            {% } %}
        </div>
        <div class="pos-v2-header-right">
            <span class="pos-v2-connection-status">
                <span class="pos-v2-status-dot"></span>
                <span class="pos-v2-status-text">Checking...</span>
            </span>
        </div>
    </div>
    
    <!-- Alert Banner (conditional) -->
    <div class="pos-v2-alert-banner" style="display: none;">
        <strong>⚠️ คำเตือน:</strong>
        <span class="pos-v2-alert-message"></span>
    </div>
    
    <!-- Main Content -->
    <div class="pos-v2-main">
        
        <!-- Left Panel - Items -->
        <div class="pos-v2-items-panel">
            <!-- Search Bar -->
            <div class="pos-v2-search-bar">
                <input type="text" 
                       class="pos-v2-search-input" 
                       placeholder="🔍 ค้นหายา: ชื่อยา, Generic, Barcode, Batch No">
            </div>
            
            <!-- Category Filter -->
            <div class="pos-v2-category-filter">
                <!-- Categories will be rendered here -->
            </div>
            
            <!-- Item Grid -->
            <div class="pos-v2-item-grid">
                <!-- Items will be rendered here -->
            </div>
        </div>
        
        <!-- Right Panel - Cart -->
        <div class="pos-v2-cart-panel">
            <!-- Cart Header -->
            <div class="pos-v2-cart-header">
                <h4>🛒 รายการยา (<span class="pos-v2-cart-count">0</span>)</h4>
                <button class="pos-v2-btn pos-v2-btn-text pos-v2-btn-sm">
                    🗑️ Clear All
                </button>
            </div>
            
            <!-- Cart Items -->
            <div class="pos-v2-cart-items">
                <div class="pos-v2-empty-cart">
                    <i class="fa fa-shopping-cart fa-3x" style="color: #cbd5e1;"></i>
                    <p>ไม่มีรายการยา</p>
                </div>
            </div>
            
            <!-- Cart Summary -->
            <div class="pos-v2-cart-summary">
                <div class="pos-v2-summary-row">
                    <span>รวมราคาสินค้า</span>
                    <span class="pos-v2-summary-value">฿ 0.00</span>
                </div>
                <div class="pos-v2-summary-row">
                    <span>ส่วนลด</span>
                    <span class="pos-v2-summary-value">฿ 0.00</span>
                </div>
                <div class="pos-v2-summary-row">
                    <span>ภาษีมูลค่าเพิ่ม 7%</span>
                    <span class="pos-v2-summary-value">฿ 0.00</span>
                </div>
                <div class="pos-v2-summary-row pos-v2-summary-total">
                    <span>รวมทั้งสิ้น</span>
                    <span class="pos-v2-summary-value">฿ 0.00</span>
                </div>
            </div>
            
            <!-- Payment Button -->
            <div class="pos-v2-cart-footer">
                <button class="pos-v2-btn pos-v2-btn-primary pos-v2-btn-lg pos-v2-btn-block">
                    💳 ชำระเงิน
                </button>
            </div>
        </div>
        
    </div>
    
    <!-- Footer -->
    <div class="pos-v2-footer">
        <div>🔄 Synced 2 min ago</div>
        <div>📋 <span class="pos-v2-offline-count">0</span> Offline Invoices</div>
        <div>⚙️ Settings</div>
    </div>
    
</div>
```

### Step 1.5: Register Templates and CSS in build.json

**File: `erpnext/public/build.json`**

Add new entries to the existing arrays:

```json
{
    "css/erpnext.css": [
        "public/css/erpnext.css",
        "public/css/pos_v2/variables.css",
        "public/css/pos_v2/layout.css",
        "public/css/pos_v2/components.css",
        "public/css/pos_v2/animations.css",
        "public/css/pos_v2/responsive.css"
    ],
    "js/erpnext.min.js": [
        "... existing entries ...",
        "public/js/pos_v2/pos_v2_layout.html",
        "public/js/pos_v2/pos_v2_item_card.html",
        "public/js/pos_v2/pos_v2_cart_item.html",
        "public/js/pos_v2/pos_v2_payment_panel.html"
    ]
}
```

> **Critical:** Without this step, `frappe.render_template("pos_v2_layout", data)` will fail with "Template not found". Run `bench build` after editing.

### Step 1.6: Modify pos_v2.js to Use New Layout

**File: `erpnext/accounts/page/pos_v2/pos_v2.js`**

At this phase, we switch from including the original `pos.js` to copying and modifying it. Copy the entire content of `pos.js` into `pos_v2.js` and make these changes:

**Change 1:** Replace page name references
```javascript
// Change all occurrences of:
frappe.pages['pos']
// To:
frappe.pages['pos-v2']
```

**Change 2:** Replace title
```javascript
title: __('Point of Sale V2'),
```

**Change 3:** Replace `make_control` to use new layout template
```javascript
make_control: function() {
    this.frm = {}
    this.frm.doc = this.doc
    this.set_transaction_defaults("Customer");
    this.frm.doc["allow_user_to_edit_rate"] = this.pos_profile_data["allow_user_to_edit_rate"] ? true : false;
    
    // Use new V2 layout instead of "pos" template
    this.wrapper.html(frappe.render_template("pos_v2_layout", this.frm.doc));
    
    this.make_search();
    this.make_customer();
    this.make_list_customers();
    this.bind_numeric_keypad();
},
```

**Change 4:** Override localStorage keys to avoid conflict with original POS
```javascript
update_localstorage: function () {
    try {
        localStorage.setItem('sales_invoice_doc_v2', JSON.stringify(this.si_docs));
    } catch (e) {
        frappe.throw(__("LocalStorage is full, did not save"))
    }
},

get_doc_from_localstorage: function () {
    try {
        return JSON.parse(localStorage.getItem('sales_invoice_doc_v2')) || [];
    } catch (e) {
        return []
    }
},

update_email_queue: function () {
    try {
        localStorage.setItem('email_queue_v2', JSON.stringify(this.email_queue));
    } catch (e) {
        frappe.throw(__("LocalStorage is full, did not save"))
    }
},

get_email_queue: function () {
    try {
        return JSON.parse(localStorage.getItem('email_queue_v2')) || {};
    } catch (e) {
        return {}
    }
},

get_customers_details: function () {
    try {
        return JSON.parse(localStorage.getItem('customer_details_v2')) || {};
    } catch (e) {
        return {}
    }
},

update_customer_in_localstorage: function() {
    try {
        localStorage.setItem('customer_details_v2', JSON.stringify(this.customer_details));
    } catch (e) {
        frappe.throw(__("LocalStorage is full, did not save"))
    }
},
```

> **Why copy instead of extend?** The `.extend()` approach with `_super()` is fragile for deep modifications. Copying gives full control and avoids inheritance bugs. The tradeoff is that bug fixes to the original POS won't automatically apply to V2.
```

### Step 1.7: Build and Test

```bash
# Build assets (REQUIRED after editing build.json or adding templates)
bench build

# Clear cache
bench clear-cache

# Restart
bench restart
```

**Test:**
1. Open `/desk#pos-v2`
2. Should see new layout structure
3. Verify CSS variables applied
4. Check console for initialization message

### ✅ Phase 1 Checklist

- [ ] CSS files created in `erpnext/public/css/pos_v2/`
- [ ] CSS variables defined
- [ ] Layout styles created
- [ ] New layout template created in `erpnext/public/js/pos_v2/`
- [ ] Templates registered in `erpnext/public/build.json`
- [ ] CSS registered in `erpnext/public/build.json`
- [ ] pos_v2.js copied from pos.js and modified
- [ ] localStorage keys changed to `*_v2`
- [ ] `bench build` run successfully
- [ ] New layout visible in browser
- [ ] No JavaScript errors in console

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## Phase 2: Item Display Redesign

**Duration:** 1-2 weeks  
**Goal:** Create modern item cards with pharmacy-specific information

### Current Status: ⬜ Not Started

### Prerequisites
- ✅ Phase 1 complete
- ✅ New layout working

### Overview
Redesign item display with:
- Modern card design
- Prominent generic names
- Stock status indicators
- Expiry warnings
- Better images/placeholders

### Step 2.1: Create Item Card Component CSS

**File: `erpnext/public/css/pos_v2/components.css`**

```css
/* Item Card */
.pos-v2-item-card {
  background: var(--pos-primary-white);
  border: 1px solid var(--pos-border);
  border-radius: var(--pos-radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: var(--pos-transition);
  display: flex;
  flex-direction: column;
}

.pos-v2-item-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--pos-shadow-md);
  border-color: var(--pos-primary-blue);
}

.pos-v2-item-image {
  height: 150px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pos-v2-item-image img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.pos-v2-item-placeholder {
  font-size: 48px;
  color: #cbd5e1;
  font-weight: bold;
}

.pos-v2-item-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: var(--pos-radius-full);
  font-size: var(--pos-text-xs);
  font-weight: var(--pos-font-bold);
}

.pos-v2-badge-danger {
  background: var(--pos-danger);
  color: white;
}

.pos-v2-badge-warning {
  background: var(--pos-warning);
  color: white;
}

.pos-v2-item-info {
  padding: var(--pos-space-3);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pos-v2-item-name {
  font-size: var(--pos-text-lg);
  font-weight: var(--pos-font-semibold);
  margin: 0 0 4px 0;
  color: var(--pos-text-primary);
}

.pos-v2-item-generic {
  font-size: var(--pos-text-sm);
  color: var(--pos-text-secondary);
  font-style: italic;
  margin: 0 0 8px 0;
}

.pos-v2-item-meta {
  display: flex;
  gap: var(--pos-space-2);
  margin-bottom: 8px;
  font-size: var(--pos-text-xs);
  color: var(--pos-text-muted);
}

.pos-v2-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.pos-v2-item-price {
  font-size: var(--pos-text-xl);
  font-weight: var(--pos-font-bold);
  color: var(--pos-primary-blue);
}

.pos-v2-item-stock {
  font-size: var(--pos-text-sm);
  padding: 2px 8px;
  border-radius: var(--pos-radius-sm);
}

.pos-v2-stock-high {
  background: #d1fae5;
  color: #065f46;
}

.pos-v2-stock-medium {
  background: #fed7aa;
  color: #92400e;
}

.pos-v2-stock-low {
  background: #fee2e2;
  color: #991b1b;
}

.pos-v2-stock-out {
  background: #f1f5f9;
  color: #64748b;
}

/* Item Grid */
.pos-v2-item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--pos-space-4);
  margin-top: var(--pos-space-4);
}
```

### Step 2.2: Create Item Card Template

**File: `erpnext/public/js/pos_v2/pos_v2_item_card.html`**

```html
<div class="pos-v2-item-card" data-item-code="{{ item_code }}">
    
    <!-- Image -->
    <div class="pos-v2-item-image">
        {% if (item_image) { %}
        <img src="{{ item_image }}" alt="{{ item_name }}">
        {% } else { %}
        <div class="pos-v2-item-placeholder">
            {%= frappe.get_abbr(item_name || item_code) %}
        </div>
        {% } %}
        
        <!-- Expiry Badge -->
        {% if (expiry_warning) { %}
        <span class="pos-v2-item-badge pos-v2-badge-{{ expiry_warning }}">
            ⚠️ หมดอายุเร็ว
        </span>
        {% } %}
    </div>
    
    <!-- Info -->
    <div class="pos-v2-item-info">
        <h4 class="pos-v2-item-name">{{ item_name || item_code }}</h4>
        
        {% if (generic_name) { %}
        <p class="pos-v2-item-generic">({{ generic_name }})</p>
        {% } %}
        
        <div class="pos-v2-item-meta">
            {% if (brand) { %}
            <span>🏷️ {{ brand }}</span>
            {% } %}
            {% if (batch_no) { %}
            <span>📦 {{ batch_no }}</span>
            {% } %}
        </div>
        
        <div class="pos-v2-item-footer">
            <span class="pos-v2-item-price">{{ item_price }}</span>
            <span class="pos-v2-item-stock pos-v2-stock-{{ stock_status }}">
                {{ stock_text }}
            </span>
        </div>
    </div>
    
</div>
```

### Step 2.3: Modify make_item_list() Method

In `pos_v2.js`, find the existing `make_item_list` function and replace it:

```javascript
make_item_list: function () {
	var me = this;
	if (!this.price_list) {
		frappe.msgprint(__("Price List not found or disabled"));
		return;
	}

	var $wrap = me.wrapper.find(".pos-v2-item-grid");
	$wrap.empty();

	if (this.items.length > 0) {
		$.each(this.items, function(index, obj) {
			if(index < me.page_len) {
				
				// Calculate stock status
				var stock_qty = me.get_actual_qty(obj);
				var stock_status = 'out';
				var stock_text = 'Out of Stock';
				
				if (stock_qty > 50) {
					stock_status = 'high';
					stock_text = 'Stock: ' + stock_qty;
				} else if (stock_qty > 10) {
					stock_status = 'medium';
					stock_text = 'Stock: ' + stock_qty;
				} else if (stock_qty > 0) {
					stock_status = 'low';
					stock_text = 'Stock: ' + stock_qty;
				}
				
				// Check expiry warning
				var expiry_warning = null;
				var batch_data = me.batch_no_data[obj.item_code];
				if (batch_data && batch_data.length > 0) {
					var nearest_expiry = batch_data[0].expiry_date;
					if (nearest_expiry) {
						var months_to_expiry = moment(nearest_expiry).diff(moment(), 'months');
						if (months_to_expiry < 3) {
							expiry_warning = 'danger';
						} else if (months_to_expiry < 6) {
							expiry_warning = 'warning';
						}
					}
				}
				
				// Render item card
				$(frappe.render_template("pos_v2_item_card", {
					item_code: obj.item_code,
					item_name: obj.item_name || obj.item_code,
					generic_name: obj.generic_name || '',
					brand: obj.brand || '',
					item_image: obj.image,
					item_price: format_currency(me.price_list_data[obj.item_code], me.frm.doc.currency),
					stock_qty: stock_qty,
					stock_status: stock_status,
					stock_text: stock_text,
					expiry_warning: expiry_warning,
					batch_no: batch_data && batch_data.length > 0 ? batch_data[0].batch_no : ''
				})).appendTo($wrap);
			}
		});
	} else {
		$wrap.html('<p class="text-muted text-center">ไม่พบรายการยา</p>');
	}
}
```

### ✅ Phase 2 Checklist

- [ ] Item card CSS created
- [ ] Item card template created
- [ ] make_item_list() method overridden
- [ ] Stock status calculation implemented
- [ ] Expiry warning logic implemented
- [ ] Generic name displayed
- [ ] Modern card design visible
- [ ] Hover effects working
- [ ] Stock colors correct
- [ ] Expiry badges showing

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete



---

## Phase 3: Shopping Cart Redesign

**Duration:** 1-2 weeks  
**Goal:** Modern cart with inline editing and dosage information

### Current Status: ⬜ Not Started

### Prerequisites
- ✅ Phase 2 complete
- ✅ Item cards working

### Step 3.1: Create Cart Item CSS

Add to `components.css`:

```css
/* Cart Item */
.pos-v2-cart-item {
  padding: var(--pos-space-4);
  border-bottom: 1px solid var(--pos-border);
  cursor: pointer;
  transition: var(--pos-transition);
}

.pos-v2-cart-item:hover {
  background: var(--pos-hover);
}

.pos-v2-cart-item.active {
  background: var(--pos-selected);
  border-left: 3px solid var(--pos-primary-blue);
}

.pos-v2-cart-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--pos-space-2);
}

.pos-v2-cart-item-name {
  font-weight: var(--pos-font-semibold);
  font-size: var(--pos-text-base);
  margin: 0;
}

.pos-v2-cart-item-generic {
  font-size: var(--pos-text-sm);
  color: var(--pos-text-secondary);
  font-style: italic;
}

.pos-v2-cart-item-meta {
  display: flex;
  gap: var(--pos-space-3);
  margin: var(--pos-space-2) 0;
  font-size: var(--pos-text-sm);
  color: var(--pos-text-muted);
}

.pos-v2-cart-item-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--pos-space-3);
}

.pos-v2-qty-control {
  display: flex;
  align-items: center;
  gap: var(--pos-space-2);
}

.pos-v2-qty-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--pos-border);
  border-radius: var(--pos-radius-sm);
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--pos-transition);
}

.pos-v2-qty-btn:hover {
  background: var(--pos-hover);
  border-color: var(--pos-primary-blue);
}

.pos-v2-qty-input {
  width: 60px;
  text-align: center;
  border: 1px solid var(--pos-border);
  border-radius: var(--pos-radius-sm);
  padding: 4px;
  font-size: var(--pos-text-base);
  font-weight: var(--pos-font-semibold);
}

.pos-v2-cart-item-amount {
  font-size: var(--pos-text-lg);
  font-weight: var(--pos-font-bold);
  color: var(--pos-primary-blue);
}

.pos-v2-cart-item-remove {
  color: var(--pos-danger);
  cursor: pointer;
  padding: 4px 8px;
}

.pos-v2-cart-item-remove:hover {
  background: #fee2e2;
  border-radius: var(--pos-radius-sm);
}

/* Dosage Panel */
.pos-v2-dosage-panel {
  background: #f8fafc;
  padding: var(--pos-space-3);
  margin-top: var(--pos-space-3);
  border-radius: var(--pos-radius-sm);
  border: 1px solid var(--pos-border);
}

.pos-v2-dosage-label {
  font-size: var(--pos-text-sm);
  color: var(--pos-text-secondary);
  margin-bottom: 4px;
}

.pos-v2-dosage-value {
  font-size: var(--pos-text-base);
  color: var(--pos-text-primary);
  padding: 4px 0;
}

.pos-v2-dosage-actions {
  display: flex;
  gap: var(--pos-space-2);
  margin-top: var(--pos-space-2);
}
```

### Step 3.2: Create Cart Item Template

**File: `erpnext/public/js/pos_v2/pos_v2_cart_item.html`**

```html
<div class="pos-v2-cart-item {{ selected_class }}" data-item-code="{{ item_code }}" data-idx="{{ idx }}">
    
    <!-- Header -->
    <div class="pos-v2-cart-item-header">
        <div>
            <h5 class="pos-v2-cart-item-name">{{ item_name || item_code }}</h5>
            {% if (generic_name) { %}
            <p class="pos-v2-cart-item-generic">({{ generic_name }})</p>
            {% } %}
        </div>
        <span class="pos-v2-cart-item-remove" data-action="remove">
            ❌
        </span>
    </div>
    
    <!-- Meta Info -->
    <div class="pos-v2-cart-item-meta">
        {% if (batch_no) { %}
        <span>📦 Batch: {{ batch_no }}</span>
        {% } %}
        {% if (expiry_date) { %}
        <span>📅 Exp: {{ expiry_date }}</span>
        {% } %}
    </div>
    
    <!-- Controls -->
    <div class="pos-v2-cart-item-controls">
        <div class="pos-v2-qty-control">
            <button class="pos-v2-qty-btn" data-action="decrease">−</button>
            <input type="number" 
                   class="pos-v2-qty-input" 
                   value="{{ qty }}" 
                   min="1">
            <button class="pos-v2-qty-btn" data-action="increase">+</button>
        </div>
        <div>
            <div style="font-size: 12px; color: #64748b;">
                @ {{ format_currency(rate) }}
            </div>
            <div class="pos-v2-cart-item-amount">
                {{ format_currency(amount) }}
            </div>
        </div>
    </div>
    
    <!-- Dosage Info (if selected) -->
    {% if (show_dosage && indication) { %}
    <div class="pos-v2-dosage-panel">
        <div class="pos-v2-dosage-label">📋 วิธีใช้:</div>
        <div class="pos-v2-dosage-value">
            {{ indication }} - {{ applyby }} {{ dosage }} {{ dosage_unit }}
        </div>
        <div class="pos-v2-dosage-actions">
            <button class="pos-v2-btn pos-v2-btn-sm pos-v2-btn-secondary" data-action="edit-dosage">
                ✏️ แก้ไข
            </button>
            <button class="pos-v2-btn pos-v2-btn-sm pos-v2-btn-secondary" data-action="print-label">
                🖨️ พิมพ์ฉลาก
            </button>
        </div>
    </div>
    {% } %}
    
</div>
```

### Step 3.3: Override show_items_in_item_cart()

In `pos_v2.js`, find the existing `show_items_in_item_cart` function and replace it:

```javascript
show_items_in_item_cart: function () {
	var me = this;
	var $items = this.wrapper.find(".pos-v2-cart-items");
	var $empty = this.wrapper.find(".pos-v2-empty-cart");
	
	// Update cart count
	this.wrapper.find(".pos-v2-cart-count").text(this.frm.doc.items.length);
	
	if (this.frm.doc.items.length === 0) {
		$empty.show();
		$items.empty();
		return;
	}
	
	$empty.hide();
	$items.empty();
	
	$.each(this.frm.doc.items || [], function (i, d) {
		// Get batch info
		var batch_info = me.batch_no_data[d.item_code];
		var expiry_date = '';
		if (batch_info && d.batch_no) {
			var batch = batch_info.find(b => b.batch_no === d.batch_no);
			if (batch && batch.expiry_date) {
				expiry_date = frappe.datetime.str_to_user(batch.expiry_date);
			}
		}
		
		// Get item data for generic name
		var item_data = me.items.find(item => item.item_code === d.item_code);
		
		$(frappe.render_template("pos_v2_cart_item", {
			item_code: d.item_code,
			item_name: d.item_name,
			generic_name: item_data ? item_data.generic_name : '',
			idx: d.idx,
			qty: d.qty,
			rate: d.rate,
			amount: d.amount,
			batch_no: d.batch_no || '',
			expiry_date: expiry_date,
			selected_class: (me.item_code == d.item_code) ? "active" : "",
			show_dosage: (me.item_code == d.item_code),
			indication: d.indication || '',
			applyby: d.applyby || '',
			dosage: d.dosage || '',
			dosage_unit: d.dosage_unit || ''
		})).appendTo($items);
	});
	
	// Bind events
	this.bind_cart_item_events();
}

bind_cart_item_events: function() {
	var me = this;
	
	// Quantity controls
	this.wrapper.on('click', '.pos-v2-qty-btn', function(e) {
		e.stopPropagation();
		var $item = $(this).closest('.pos-v2-cart-item');
		var item_code = $item.attr('data-item-code');
		var $input = $item.find('.pos-v2-qty-input');
		var qty = parseFloat($input.val()) || 1;
		var action = $(this).attr('data-action');
		
		if (action === 'increase') {
			qty += 1;
		} else if (action === 'decrease' && qty > 1) {
			qty -= 1;
		}
		
		$input.val(qty);
		me.update_qty(item_code, qty);
	});
	
	// Quantity input change
	this.wrapper.on('change', '.pos-v2-qty-input', function(e) {
		var $item = $(this).closest('.pos-v2-cart-item');
		var item_code = $item.attr('data-item-code');
		var qty = parseFloat($(this).val()) || 1;
		me.update_qty(item_code, qty);
	});
	
	// Remove item
	this.wrapper.on('click', '.pos-v2-cart-item-remove', function(e) {
		e.stopPropagation();
		var $item = $(this).closest('.pos-v2-cart-item');
		var idx = $item.attr('data-idx');
		me.remove_item = [idx];
		me.remove_zero_qty_item();
		me.update_paid_amount_status(false);
	});
	
	// Select item
	this.wrapper.on('click', '.pos-v2-cart-item', function() {
		me.item_code = $(this).attr('data-item-code');
		me.wrapper.find('.pos-v2-cart-item').removeClass('active');
		$(this).addClass('active');
		me.show_items_in_item_cart(); // Refresh to show dosage
	});
}
```

### ✅ Phase 3 Checklist

- [ ] Cart item CSS created
- [ ] Cart item template created
- [ ] show_items_in_item_cart() overridden
- [ ] bind_cart_item_events() implemented
- [ ] Quantity controls working
- [ ] Remove item working
- [ ] Item selection working
- [ ] Dosage info displayed
- [ ] Cart count updated
- [ ] Empty cart message shown

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## Phase 4: Patient Safety Features

**Duration:** 1-2 weeks  
**Goal:** Implement allergy warnings and controlled drug handling

### Current Status: ⬜ Not Started

### Prerequisites
- ✅ Phase 3 complete
- ✅ Cart working

### Step 4.1: Allergy Alert System

Allergy data is now available in `this.customers` array from the server. In `pos_v2.js`, find the `update_customer_data` function and modify it:

```javascript
update_customer_data: function (doc) {
	var me = this;
	this.frm.doc.customer = doc.label || doc.name;
	this.frm.doc.customer_name = doc.customer_name;
	this.frm.doc.customer_group = doc.customer_group;
	this.frm.doc.territory = doc.territory;
	this.pos_bill.show();
	this.numeric_keypad.show();
	
	// Check for drug allergies
	this.check_drug_allergies(doc);
},

check_drug_allergies: function(customer) {
	var $alert = this.wrapper.find('.pos-v2-alert-banner');
	var $message = this.wrapper.find('.pos-v2-alert-message');
	
	if (customer.is_drug_allergy && customer.drug_allergy_detail) {
		$message.html('คนไข้แพ้ยา: <strong>' + customer.drug_allergy_detail + '</strong>');
		$alert.slideDown(300);
		this.customer_allergies = customer.drug_allergy_detail.toLowerCase();
	} else {
		$alert.slideUp(300);
		this.customer_allergies = null;
	}
},
```

### Step 4.2: Controlled Drug (ขย.) Handling

> **Note:** The current POS already handles ขย. in the `set_primary_action` and `bind_numeric_keypad` functions. In POS V2, this logic is already present in the copied code. The improvement here is adding visual indicators.

Add the ขย. badge to `pos_v2_cart_item.html` (already shown in Step 3.2). The `is_khoryor` field is available from `this.items[0].is_khoryor` and is already copied to cart items in `add_new_item_to_grid()`.

### Step 4.3: Add Visual Indicators for Controlled Drugs

Modify cart item template to show badge:

```html
<!-- Add after item name in pos_v2_cart_item.html -->
{% if (is_khoryor) { %}
<span class="pos-v2-badge" style="background: #f59e0b; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">
    ขย.
</span>
{% } %}
```

### ✅ Phase 4 Checklist

- [ ] Allergy alert system implemented
- [ ] Alert banner shows/hides correctly
- [ ] Allergy warning on add to cart
- [ ] Confirmation dialog working
- [ ] Controlled drug detection
- [ ] Patient name prompt
- [ ] ขย. badge displayed
- [ ] Payment blocked without patient name
- [ ] Visual indicators clear

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## Phase 5: Workflow Optimization

**Duration:** 1-2 weeks  
**Goal:** Streamline common workflows and add keyboard shortcuts

### Current Status: ⬜ Not Started

### Prerequisites
- ✅ Phase 4 complete
- ✅ Safety features working

### Step 5.1: Keyboard Shortcuts

In `pos_v2.js`, add this method to the class and call it from `init()`:

```javascript
// In init(), add at the end:
this.bind_keyboard_shortcuts();

// New method:
bind_keyboard_shortcuts: function() {
	var me = this;
	
	$(document).on('keydown.pos_v2', function(e) {
		// Only handle if POS V2 is active
		if (frappe.get_route()[0] !== 'pos-v2') return;
		
		if (e.key === 'F1') {
			e.preventDefault();
			me.serach_item.$input.focus();
		}
		
		if (e.key === 'F3') {
			e.preventDefault();
			me.party_field.$input.focus();
		}
		
		if (e.key === 'F8') {
			e.preventDefault();
			me.page.btn_primary.click();
		}
		
		if (e.ctrlKey && e.key === 'n') {
			e.preventDefault();
			me.save_previous_entry();
			me.create_new();
		}
		
		if (e.key === 'Escape') {
			me.item_code = null;
			me.clear_selected_row();
		}
	});
},
```

### Step 5.2: Quick Payment Panel

> **Note:** The current POS already has a payment flow via `make_payment()` which uses `erpnext.payments`. For V2, you can either keep the existing payment dialog or create an inline panel. The inline approach requires creating a new template `pos_v2_payment_panel.html` and registering it in `build.json` (already done in Step 1.5).

This is an optional enhancement. The existing payment flow works as-is in the copied code.

### ✅ Phase 5 Checklist

- [ ] Keyboard shortcuts implemented
- [ ] F1, F3, F8 working
- [ ] Ctrl+N working
- [ ] Delete key working
- [ ] Escape key working
- [ ] Inline payment panel created
- [ ] Change calculation working
- [ ] Payment completion working
- [ ] Shortcuts documented

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete



---

## Phase 6: Polish & Testing

**Duration:** 1-2 weeks  
**Goal:** Add animations, test thoroughly, fix bugs

### Current Status: ⬜ Not Started

### Prerequisites
- ✅ All previous phases complete
- ✅ Core functionality working

### Step 6.1: Add Animations

**File: `erpnext/public/css/pos_v2/animations.css`**

```css
/* Animations */

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Apply animations */
.pos-v2-alert-banner {
  animation: slideDown 0.3s ease;
}

.pos-v2-cart-item {
  animation: fadeIn 0.2s ease;
}

.pos-v2-item-card {
  animation: fadeIn 0.3s ease;
}

.pos-v2-badge-danger {
  animation: pulse 2s infinite;
}
```

### Step 6.2: Responsive Design

**File: `erpnext/public/css/pos_v2/responsive.css`**

```css
/* Tablet (1024px and below) */
@media (max-width: 1024px) {
  .pos-v2-items-panel {
    flex: 0 0 50%;
  }
  
  .pos-v2-cart-panel {
    flex: 0 0 50%;
  }
  
  .pos-v2-item-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

/* Tablet Portrait (768px and below) */
@media (max-width: 768px) {
  .pos-v2-main {
    flex-direction: column;
  }
  
  .pos-v2-items-panel,
  .pos-v2-cart-panel {
    flex: 1;
    max-height: 50vh;
  }
  
  .pos-v2-item-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .pos-v2-header {
    flex-wrap: wrap;
  }
}
```

### Step 6.3: Testing Checklist

**Functional Testing:**
- [ ] Item search works
- [ ] Item filtering works
- [ ] Add to cart works
- [ ] Quantity controls work
- [ ] Remove item works
- [ ] Customer selection works
- [ ] Allergy alert shows
- [ ] Controlled drug prompt shows
- [ ] Payment works
- [ ] Invoice creation works
- [ ] Offline sync works
- [ ] Print receipt works
- [ ] Print label works

**UI/UX Testing:**
- [ ] Layout looks good on desktop
- [ ] Layout looks good on tablet
- [ ] Colors are correct
- [ ] Fonts are readable
- [ ] Buttons are clickable
- [ ] Hover effects work
- [ ] Animations are smooth
- [ ] No visual glitches

**Performance Testing:**
- [ ] Page loads < 2 seconds
- [ ] Search responds < 100ms
- [ ] Add to cart < 50ms
- [ ] No lag when scrolling
- [ ] Smooth animations (60fps)

**Keyboard Testing:**
- [ ] All shortcuts work
- [ ] Tab navigation works
- [ ] Enter key works
- [ ] Escape key works

**Edge Cases:**
- [ ] Empty cart
- [ ] Out of stock items
- [ ] Expired batches
- [ ] Customer with allergies
- [ ] Controlled drugs
- [ ] Offline mode
- [ ] Large item list (1000+ items)
- [ ] Long item names
- [ ] Missing images

### Step 6.4: Bug Fixes

Create a bug tracking list:

```markdown
## Known Issues

### High Priority
- [ ] Issue 1: Description
- [ ] Issue 2: Description

### Medium Priority
- [ ] Issue 3: Description

### Low Priority
- [ ] Issue 4: Description

### Fixed
- [x] Issue 5: Description - Fixed in commit abc123
```

### ✅ Phase 6 Checklist

- [ ] Animations added
- [ ] Responsive CSS added
- [ ] All functional tests passed
- [ ] All UI/UX tests passed
- [ ] Performance targets met
- [ ] Keyboard shortcuts tested
- [ ] Edge cases handled
- [ ] Bugs documented
- [ ] Critical bugs fixed
- [ ] User acceptance testing done

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## Deployment Strategy

### Pre-Deployment

**1. Final Testing**
```bash
# Run on test environment
bench --site test.site migrate
bench --site test.site clear-cache
bench --site test.site restart
```

**2. Backup Production**
```bash
# Backup before deployment
bench --site production.site backup
```

**3. Documentation**
- [ ] User guide created
- [ ] Training materials prepared
- [ ] Video tutorials recorded
- [ ] FAQ document ready

### Deployment Steps

**Step 1: Deploy to Production**
```bash
# Pull latest code
cd /path/to/erpnext
git pull origin main

# Build assets
bench build

# Clear cache
bench --site production.site clear-cache

# Restart
bench restart
```

**Step 2: Verify Deployment**
- [ ] POS V2 accessible at `/desk#pos-v2`
- [ ] Original POS still works at `/desk#pos`
- [ ] No JavaScript errors in console
- [ ] Basic functionality works

**Step 3: Gradual Rollout**

**Week 1: Internal Testing**
- Deploy to 1-2 test terminals
- Staff training
- Collect feedback
- Fix critical issues

**Week 2-3: Pilot**
- Deploy to 25% of terminals
- Monitor usage
- Gather user feedback
- Refine workflows

**Week 4-6: Full Rollout**
- Deploy to 50% of terminals (Week 4)
- Deploy to 75% of terminals (Week 5)
- Deploy to 100% of terminals (Week 6)

**Week 7-8: Stabilization**
- Monitor for issues
- Fix bugs
- Optimize performance
- Collect feedback

**Week 9+: Deprecate Old POS**
- Redirect `/desk#pos` to `/desk#pos-v2`
- Keep old POS available for 1 month
- Remove old POS after confirmation

### Rollback Plan

If critical issues found:

```bash
# Revert to previous version
git revert <commit-hash>

# Or redirect POS V2 to old POS
# Modify pos_v2.js to redirect
frappe.set_route('pos');
```

### Post-Deployment

**Monitoring:**
- [ ] Error logs checked daily
- [ ] User feedback collected
- [ ] Performance metrics tracked
- [ ] Usage statistics analyzed

**Support:**
- [ ] Help desk ready
- [ ] Quick fixes deployed
- [ ] User questions answered
- [ ] Training sessions conducted

---

## Progress Tracking

### Overall Progress

| Phase | Status | Start Date | End Date | Notes |
|-------|--------|------------|----------|-------|
| Phase 0: Duplication | ⬜ | - | - | - |
| Phase 1: Foundation | ⬜ | - | - | - |
| Phase 2: Item Display | ⬜ | - | - | - |
| Phase 3: Shopping Cart | ⬜ | - | - | - |
| Phase 4: Patient Safety | ⬜ | - | - | - |
| Phase 5: Optimization | ⬜ | - | - | - |
| Phase 6: Polish & Testing | ⬜ | - | - | - |
| Deployment | ⬜ | - | - | - |

**Legend:**
- ⬜ Not Started
- 🟡 In Progress
- ✅ Complete
- ❌ Blocked

### Current Phase Details

**Phase:** _Not Started_  
**Progress:** 0%  
**Blockers:** None  
**Next Steps:** Begin Phase 0 - Duplicate POS

### Time Tracking

**Estimated Total:** 12 weeks  
**Actual Time:** 0 weeks  
**Remaining:** 12 weeks

### Notes & Decisions

**Date: 2026-03-11**
- ✅ Design complete
- ✅ Data verification complete
- ✅ Implementation guide created
- ➡️ Ready to start Phase 0

---

## Quick Reference

### File Locations

```
erpnext/accounts/page/pos_v2/
├── pos_v2.js                      # Main JavaScript
├── pos_v2.json                    # Page metadata
└── __init__.py

erpnext/public/js/pos_v2/
├── pos_v2_layout.html             # Main layout
├── pos_v2_item_card.html          # Item card
├── pos_v2_cart_item.html          # Cart item
└── pos_v2_payment_panel.html      # Payment panel

erpnext/public/css/pos_v2/
├── variables.css                  # CSS variables
├── layout.css                     # Layout styles
├── components.css                 # Component styles
├── animations.css                 # Animations
└── responsive.css                 # Media queries
```

### Key Commands

```bash
# Build assets
bench build

# Clear cache
bench clear-cache

# Restart
bench restart

# Console
bench --site [site] console

# Backup
bench --site [site] backup

# Watch for changes (development)
bench watch
```

### Useful Links

- Original POS: `/desk#pos`
- New POS V2: `/desk#pos-v2`
- POS Settings: `/desk#Form/POS Settings`
- POS Profile: `/desk#List/POS Profile`

### Contact & Support

**Developer:** [Your Name]  
**Email:** [Your Email]  
**Documentation:** See related .md files in this directory

---

## Appendix

### A. Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| F1 | Focus search |
| F3 | Customer search |
| F8 | Payment |
| Ctrl+N | New sale |
| Delete | Remove selected item |
| Escape | Clear selection |
| Enter | Confirm/Add |
| +/- | Adjust quantity |

### C. CSS Variables Reference

See `erpnext/public/css/pos_v2/variables.css` for complete list.

### D. Component Templates Reference

See `erpnext/public/js/pos_v2/*.html` for all templates.

### E. Troubleshooting

**Problem:** POS V2 not loading  
**Solution:** Check console for errors, clear cache, rebuild assets

**Problem:** Styles not applying  
**Solution:** Verify CSS files exist, check import paths, clear browser cache

**Problem:** Templates not rendering  
**Solution:** Check template file names, verify frappe.render_template() calls

**Problem:** Data not showing  
**Solution:** Verify get_pos_data() returns data, check console logs

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-11 | Initial implementation guide created |

---

**Document Status:** ✅ Complete  
**Last Updated:** 2026-03-11  
**Ready for Implementation:** ✅ YES

---

**End of Implementation Guide**

