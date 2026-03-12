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

// Override make_control to use V2 layout template
erpnext.pos.PointOfSale.prototype.make_control_original = erpnext.pos.PointOfSale.prototype.make_control;
erpnext.pos.PointOfSale.prototype.make_control = function() {
	this.frm = {}
	this.frm.doc = this.doc
	this.set_transaction_defaults("Customer");
	this.frm.doc["allow_user_to_edit_rate"] = this.pos_profile_data["allow_user_to_edit_rate"] ? true : false;
	
	// Use V2 layout template
	this.wrapper.html(frappe.render_template("pos_v2_layout", this.frm.doc));
	
	this.make_search();
	this.make_customer();
	this.make_list_customers();
	this.bind_numeric_keypad();
}

// Override localStorage keys to avoid conflict with original POS
erpnext.pos.PointOfSale.prototype.get_doc_from_localstorage = function () {
	try {
		return JSON.parse(localStorage.getItem('sales_invoice_doc_v2')) || [];
	} catch (e) {
		return []
	}
};

erpnext.pos.PointOfSale.prototype.update_localstorage = function () {
	try {
		localStorage.setItem('sales_invoice_doc_v2', JSON.stringify(this.si_docs));
	} catch (e) {
		frappe.throw(__("LocalStorage is full, did not save"))
	}
};

erpnext.pos.PointOfSale.prototype.get_email_queue = function () {
	try {
		return JSON.parse(localStorage.getItem('email_queue_v2')) || {};
	} catch (e) {
		return {}
	}
};

erpnext.pos.PointOfSale.prototype.update_email_queue = function () {
	try {
		localStorage.setItem('email_queue_v2', JSON.stringify(this.email_queue));
	} catch (e) {
		frappe.throw(__("LocalStorage is full, did not save"))
	}
};

erpnext.pos.PointOfSale.prototype.get_customers_details = function () {
	try {
		return JSON.parse(localStorage.getItem('customer_details_v2')) || {};
	} catch (e) {
		return {}
	}
};

erpnext.pos.PointOfSale.prototype.update_customer_in_localstorage = function() {
	try {
		localStorage.setItem('customer_details_v2', JSON.stringify(this.customer_details));
	} catch (e) {
		frappe.throw(__("LocalStorage is full, did not save"))
	}
};

// Phase 2: Override make_item_list for V2 Item Cards
erpnext.pos.PointOfSale.prototype.make_item_list = function () {
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
				var stock_text = 'สินค้าหมด';
				
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
						var moment = window.moment;
						var months_to_expiry = moment(nearest_expiry).diff(moment(), 'months');
						if (months_to_expiry < 3) {
							expiry_warning = 'danger';
						} else if (months_to_expiry < 6) {
							expiry_warning = 'warning';
						}
					}
				}
				
				// Get price
				var item_price = me.price_list_data[obj.item_code] || 0;
				
				// Render V2 item card
				$(frappe.render_template("pos_v2_item_card", {
					item_code: obj.item_code,
					item_name: obj.item_name || obj.item_code,
					generic_name: obj.generic_name || '',
					brand: obj.brand || '',
					item_image: obj.image,
					item_price: format_currency(item_price, me.frm.doc.currency),
					stock_qty: stock_qty,
					stock_status: stock_status,
					stock_text: stock_text,
					expiry_warning: expiry_warning,
					batch_no: batch_data && batch_data.length > 0 ? batch_data[0].batch_no : '',
					is_khoryor: obj.is_khoryor || 0
				})).appendTo($wrap);
			}
		});
	} else {
		$wrap.html('<p class="text-muted text-center">ไม่พบรายการยา</p>');
	}
};

// Phase 2: Override bind_items_event for V2 item cards
erpnext.pos.PointOfSale.prototype.bind_items_event = function() {
	var me = this;
	
	// Bind click on V2 item cards
	me.wrapper.on('click', '.pos-v2-item-card', function() {
		var item_code = $(this).attr('data-item-code');
		if (item_code) {
			me.items[0] = me.items.find(i => i.item_code === item_code);
			me.add_to_cart();
		}
	});
};

// Phase 2: Override make_search for V2 search input
erpnext.pos.PointOfSale.prototype.make_search = function () {
	var me = this;
	
	// Just bind the keypress event to the V2 search input
	me.wrapper.find('.pos-v2-search-input').on("keypress", function (event) {
		if (event.which == 13) {
			if((me.serach_item && me.serach_item.$input.val() != "") || $(this).val() != "") {
				me.serach_item = frappe.ui.form.make_control({
					df: {
						"fieldtype": "Data",
						"label": __("Search"),
						"fieldname": "search",
						"placeholder": __("Search by item code, name or barcode")
					},
					parent: me.wrapper.find('.pos-v2-search-bar'),
					render_input: true
				});
				me.serach_item.$input.val($(this).val());
				me.serach_item.$input.trigger("keypress", [13]);
			}
		}
	});
	
	// Also bind search on input for real-time filtering
	me.wrapper.find('.pos-v2-search-input').on("input", function() {
		var search_val = $(this).val().toLowerCase();
		if (search_val.length >= 2 || search_val.length === 0) {
			// Filter items
			if (me.items && me.items.length > 0) {
				var filtered = me.items.filter(function(item) {
					return (item.item_code && item.item_code.toLowerCase().includes(search_val)) ||
						   (item.item_name && item.item_name.toLowerCase().includes(search_val)) ||
						   (item.generic_name && item.generic_name.toLowerCase().includes(search_val)) ||
						   (item.barcode && item.barcode.toLowerCase().includes(search_val));
				});
				
				// Temporarily replace items with filtered
				var original_items = me.items;
				me.items = filtered;
				me.make_item_list();
				// Restore original items
				me.items = original_items;
			}
		}
	});
};
