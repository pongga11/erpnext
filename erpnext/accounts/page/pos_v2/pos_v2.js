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
