"use strict";

describe("Nano mock", function() {

	var chai = require("chai");
	var assert = chai.assert;
	var expect = chai.expect;
	var should = chai.should();
	var db, nano;
	var testData = require("./testdata.js");

	before(function(done) {
		nano = require("../nano-mock.js")({
			url : "http://foo:5984"
		});
		db = nano.use("test");
		nano.setTestData(testData);
		done();
	});

	it("an id is returned", function(done) {
		nano.request({}, function(err, id) {
			expect(id.uuids[0]).to.equal(testData.test.uuids[2]);
			done();
		});
	});

	it("a mock document is returned", function(done) {
		db.get(testData.test.uuids[0], null, function(err, doc) {
			expect(doc.type).to.equal(testData.test.rows[0].type);
			done();
		});
	});

	it("all test documents are returned when no view is defined", function(done) {
		db.view("foo", "bar", null, function(err, docs) {
			expect(docs.rows.length).to.equal(testData.test.rows.length);
			done();
		});
	});

	it("an error is raised when no view with a given name is defined", function(
			done) {
		nano.setTestViews([ {
			name : "foo/bar",
			func : function(rows) {
				return [ {} ];
			}
		} ]);
		db.view("foo", "xxx", null, function(err, docs) {
			expect(err.err).to.equal(404);
			nano.setTestViews(null);
			done();
		});
	});

	it("some documents are returned when a view function is defined", function(
			done) {
		nano.setTestViews([ {
			name : "foo/bar",
			func : function(rows) {
				return [ {
					key : "1",
					value : {
						mimetype : rows[0].data.mimetype
					}
				} ];
			}
		} ]);
		db.view("foo", "bar", null, function(err, docs) {
			expect(docs.rows[0].value.mimetype).to
					.equal(testData.test.rows[0].data.mimetype);
			nano.setTestViews(null);
			done();
		});
	});

	it("an empty object is returned when no list is defined", function(done) {
		db.view_docs_with_list("foo", "bar", "etc", null, function(err, docs) {
			expect(err.err).to.equal(404);
			done();
		});
	});

	it("an error is raised when no list with a given name is defined", function(
			done) {
		nano.setTestLists([ {
			name : "foo/etc",
			func : function(rows) {
				return [ {} ];
			}
		} ]);
		db.view_docs_with_list("foo", "xxx", "bar", null, function(err, doc) {
			expect(err.err).to.equal(404);
			nano.setTestLists(null);
			done();
		});
	});

	it("a document is returned when a list function is defined", function(done) {
		nano.setTestViews([ {
			name : "foo/bar",
			func : function(rows) {
				return [ {
					key : "1",
					value : {
						mimetype : rows[0].data.mimetype
					}
				} ];
			}
		} ]);
		nano.setTestLists([ {
			name : "foo/etc",
			func : function(err, doc) {
				return {
					doc : {
						type : doc.rows[0].value.mimetype
					},
					headers : {}
				};
			}
		} ]);
		db.view_docs_with_list("foo", "bar", "etc", null, function(err, doc) {
			expect(doc.type).to.equal(testData.test.rows[0].data.mimetype);
			nano.setTestViews(null);
			nano.setTestLists(null);
			done();
		});
	});

});
