# coding=utf-8

from __future__ import unicode_literals
from frappe import _

def get_data():
	return [
		{
			"module_name": "Accounts",
			"color": "#183A60",
			"icon": "octicon octicon-repo",
			"label": _("Accounts"),
			"type": "module"
		},
		{
			"module_name": "CRM",
			"color": "#183A60",
			"icon": "octicon octicon-broadcast",
			"type": "module"
		},
		{
			"module_name": "Selling",
			"color": "#183A60",
			"icon": "icon-tag",
			"icon": "octicon octicon-tag",
			"type": "module"
		},
		{
			"module_name": "Buying",
			"color": "#183A60",
			"icon": "icon-shopping-cart",
			"icon": "octicon octicon-briefcase",
			"type": "module"
		},
		{
			"module_name": "HR",
			"color": "#183A60",
			"icon": "icon-group",
			"icon": "octicon octicon-organization",
			"label": _("Human Resources"),
			"type": "module"
		},
		{
			"module_name": "Manufacturing",
			"color": "#183A60",
			"icon": "icon-cogs",
			"icon": "octicon octicon-tools",
			"type": "module"
		},
		{
			"module_name": "POS",
<<<<<<< HEAD
			"color": "#589494",
=======
			"color": "#183A60",
			"icon": "icon-th",
>>>>>>> 3b8b91020a496cfa1cbe728a755aa3cf61c80021
			"icon": "octicon octicon-credit-card",
			"type": "page",
			"link": "pos",
			"label": _("POS")
		},
		{
			"module_name": "Projects",
			"color": "#183A60",
			"icon": "icon-puzzle-piece",
			"icon": "octicon octicon-rocket",
			"type": "module"
		},
		{
			"module_name": "Stock",
			"color": "#183A60",
			"icon": "icon-truck",
			"icon": "octicon octicon-package",
			"type": "module"
		},
		{
			"module_name": "Support",
			"color": "#183A60",
			"icon": "icon-phone",
			"icon": "octicon octicon-issue-opened",
			"type": "module"
		},
		{
			"module_name": "Learn",
			"color": "#183A60",
			"icon": "octicon octicon-device-camera-video",
			"type": "module",
			"is_help": True,
<<<<<<< HEAD
			"label": _("Learn"),
			"hidden": 1
		},
		{
			"module_name": "Maintenance",
			"color": "#FF888B",
			"icon": "octicon octicon-tools",
			"type": "module",
			"label": _("Maintenance")
		},
		{
			"module_name": "Student",
			"color": "#c0392b",
			"icon": "octicon octicon-person",
			"label": _("Student"),
			"link": "List/Student",
			"_doctype": "Student",
			"type": "list"
		},
		{
			"module_name": "Student Group",
			"color": "#d59919",
			"icon": "octicon octicon-organization",
			"label": _("Student Group"),
			"link": "List/Student Group",
			"_doctype": "Student Group",
			"type": "list"
		},
		{
			"module_name": "Course Schedule",
			"color": "#fd784f",
			"icon": "octicon octicon-calendar",
			"label": _("Course Schedule"),
			"link": "Calendar/Course Schedule",
			"_doctype": "Course Schedule",
			"type": "list"
		},
		{
			"module_name": "Student Attendance",
			"color": "#3aacba",
			"icon": "octicon octicon-checklist",
			"label": _("Student Attendance"),
			"link": "List/Student Attendance",
			"_doctype": "Student Attendance",
			"type": "list"
		},
		{
			"module_name": "Course",
			"color": "#8e44ad",
			"icon": "octicon octicon-book",
			"label": _("Course"),
			"link": "List/Course",
			"_doctype": "Course",
			"type": "list"
		},
		{
			"module_name": "Program",
			"color": "#9b59b6",
			"icon": "octicon octicon-repo",
			"label": _("Program"),
			"link": "List/Program",
			"_doctype": "Program",
			"type": "list"
		},
		{
			"module_name": "Student Applicant",
			"color": "#4d927f",
			"icon": "octicon octicon-clippy",
			"label": _("Student Applicant"),
			"link": "List/Student Applicant",
			"_doctype": "Student Applicant",
			"type": "list"
		},
		{
			"module_name": "Fees",
			"color": "#83C21E",
			"icon": "fa fa-money",
			"label": _("Fees"),
			"link": "List/Fees",
			"_doctype": "Fees",
			"type": "list"
		},
		{
			"module_name": "Instructor",
			"color": "#a99e4c",
			"icon": "octicon octicon-broadcast",
			"label": _("Instructor"),
			"link": "List/Instructor",
			"_doctype": "Instructor",
			"type": "list"
		},
		{
			"module_name": "Room",
			"color": "#f22683",
			"icon": "fa fa-map-marker",
			"label": _("Room"),
			"link": "List/Room",
			"_doctype": "Room",
			"type": "list"
		},
		{
			"module_name": "Schools",
			"color": "#DE2B37",
			"icon": "octicon octicon-mortar-board",
			"type": "module",
			"label": _("Schools")
		},
		{
			"module_name": "Healthcare",
			"color": "#FF888B",
			"icon": "octicon octicon-plus",
			"type": "module",
			"label": _("Healthcare"),
		},
		{
			"module_name": "Hub",
			"color": "#009248",
			"icon": "/assets/erpnext/images/hub_logo.svg",
			"type": "page",
			"link": "hub",
			"label": _("Hub")
		},
		{
			"module_name": "Data Import Tool",
			"color": "#7f8c8d",
			"icon": "octicon octicon-circuit-board",
			"type": "page",
			"link": "data-import-tool",
			"label": _("Data Import Tool")
		},
		{
			"module_name": "Restaurant",
			"color": "#EA81E8",
			"icon": "🍔",
			"_doctype": "Restaurant",
			"link": "List/Restaurant",
			"label": _("Restaurant")
=======
			"label": _("Learn")
>>>>>>> 3b8b91020a496cfa1cbe728a755aa3cf61c80021
		}
	]
