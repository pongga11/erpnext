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
