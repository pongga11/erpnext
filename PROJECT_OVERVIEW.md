# ERPNext BaanYaYim - Project Overview

## Basic Information

| Property | Value |
|----------|-------|
| **Project Name** | ERPNext (BaanYaYim Custom) |
| **Version** | 9.x (v9.2.15 based on git history) |
| **Git Remote** | git@github.com:pongga11/erpnext.git |
| **Local Path** | /root/.openclaw/workspace/sourceCode/erpnext |
| **Branch** | master |
| **Framework** | Frappé Framework (Python + JavaScript) |
| **License** | GNU General Public License (v3) |

## Project Structure

```
erpnext/
├── accounts/          # Accounting模块 (GL, Invoices, Payments)
├── buying/            # Purchasing模块
├── crm/               # CRM模块
├── healthcare/        # Healthcare模块
├── hr/                # Human Resources模块
├── manufacturing/     # Manufacturing模块
├── projects/          # Project Management
├── selling/           # Sales & POS模块
├── stock/             # Inventory & Stock模块
├── support/           # Customer Support
├── schools/           # Education模块
├── regional/          # 区域特定功能 (Thailand)
├── patches/           # Database migrations
├── public/            # Frontend assets (JS, CSS)
├── templates/         # Website templates
└── hooks.py           # App hooks & configuration
```

## BaanYaYim Customizations

### Custom Reports (Selling/Report)
- **koryor9** - Custom sales report
- **koryor11** - Custom sales report (detailed)
- **koryor11_all_by_date** - Sales by date
- **koryor13** - Additional custom report

### POS (Point of Sale) Modifications
- Custom POS page (`erpnext/accounts/page/pos/`)
- POS payment customization
- POS item usage tracking

### Batch/Lot Management (Recent Work)
- Auto-create batch/lot functionality
- Batch quantity grouping
- Batch sync fixes
- Stock ledger entry modifications

### Other Customizations
- Customer display socket integration (`bb0546349`)
- Thai language support
- Custom Gross Profit report
- Profitability analysis modifications

## Recent Git Commits (BaanYaYim Changes)

| Commit | Description |
|--------|-------------|
| `269080878` | Grouping qty |
| `ff2f24442` | Grouping batches qty |
| `ac13fe1fb` | Fix batch |
| `460bdd1cb` | Fix batch sync |
| `7201a2a80` | Auto create batch (lot) |
| `bb0546349` | Customer display socket.it |
| `2639cf83e` | BaanYaYim version (major customization commit) |

## Key Files to Know

### Configuration
- `erpnext/hooks.py` - App metadata, fixtures, domains

### Custom Reports
- `erpnext/selling/report/koryor*/` - Custom sales reports

### POS
- `erpnext/accounts/page/pos/pos.js`
- `erpnext/public/js/pos/`

### Stock
- `erpnext/stock/get_item_details.py` - Item details retrieval
- `erpnext/stock/stock_ledger.py` - Stock ledger entries

## Development Notes

### Database
- ERPNext uses MariaDB
- Frappé Framework with SQLite/MariaDB backends

### Installation
- Requires Frappé Bench
- See: https://github.com/frappe/bench

### Related Projects
- **Frappé Framework**: https://github.com/frappe/frappe
- **Original ERPNext**: https://github.com/frappe/erpnext

## To Explore Further
- [ ] Check regional/thailand.py for Thai-specific code
- [ ] Review custom Python controllers in erpnext/controllers/
- [ ] Look at healthcare module for medical inventory
- [ ] Check demo/ folder for sample data

---
*Last updated: 2026-03-11*
