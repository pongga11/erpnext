frappe.query_reports["KorYor11-LOT"] = {
    "filters": [
        {
            "fieldname": "from_date",
            "label": "From",
            "fieldtype": "Date",
            "reqd": 1,
        },
        {
            "fieldname": "to_date",
            "label": "To",
            "fieldtype": "Date",
            "reqd": 1,
        },
        {
            "fieldname": "item_code",
            "label": "Item",
            "fieldtype": "Link",
            "options": "Item",
            "reqd": 1,
        },
    ]
}

