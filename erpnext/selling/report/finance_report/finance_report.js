frappe.query_reports["Finance Report"] = {
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
        }
    ]
}

