frappe.query_reports["KorYor11-LOT"] = {
    filters: [
        {
            fieldname: "item_code",
            label: "Item Code",
            fieldtype: "Link",
            options: "Item",
            reqd: 1,
            get_query: function() {
                return {
                    filters: [
                        ["Item", "is_khoryor", "=", 1],
                        ["Item", "has_batch_no", "=", 1],
                        ["Item", "disabled", "=", 0]
                    ]
                };
            },
            on_change: function() {
                // เมื่อเปลี่ยน item ให้ clear batch
                frappe.query_report.set_filter_value("batch_no", "");
            }
        },
        {
            fieldname: "batch_no",
            label: "Batch No",
            fieldtype: "Link",
            options: "Batch",
            get_query: function() {
                let item_code = frappe.query_report.get_filter_value("item_code");
                if (!item_code) {
                    frappe.msgprint("กรุณาเลือก Item ก่อน");
                    return { filters: [["Batch", "name", "=", ""]] };
                }
                return {
                    filters: [
                        ["Batch", "item", "=", item_code],
                        ["Batch", "disabled", "=", 0]
                    ]
                };
            }
        }
    ]
};