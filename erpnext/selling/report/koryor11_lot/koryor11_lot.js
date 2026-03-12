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
                let filters = frappe.query_report.filters;
                for (let i = 0; i < filters.length; i++) {
                    if (filters[i].df && filters[i].df.fieldname === "batch_no") {
                        filters[i].value = "";
                        filters[i].last_value = "";
                        filters[i].$input.val("");
                        break;
                    }
                }
            }
        },
        {
            fieldname: "batch_no",
            label: "Batch No",
            fieldtype: "Link",
            options: "Batch",
            get_query: function() {
                let item_code = frappe.query_report.filters.find(
                    f => f.df.fieldname === "item_code"
                )?.value;

                if (!item_code) {
                    frappe.msgprint("กรุณาเลือก Item ก่อน");
                    return { filters: [["Batch", "name", "=", ""]] };
                }
                return {
                    filters: [
                        ["Batch", "item", "=", item_code]
                    ],
                    order_by: "expiry_date DESC"
                };
            }
        }
    ]
};