frappe.query_reports["ItemExpiry"] = {
    "filters": [

	{
            "fieldname":"from_date",
            "label": "From",
            "fieldtype": "Date",
	    "default": frappe.datetime.get_today(),
	    "reqd": 1,
        },
 	{   
            "fieldname":"to_date",
            "label": "To",
            "fieldtype": "Date",
	    "reqd": 1,
        },
    ]
}

