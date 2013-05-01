"use strict";

describe("Nano mock", function() {

	var chai = require("chai");
	var assert = chai.assert;
	var expect = chai.expect;
	var should = chai.should();
	var db, nano;
	var testData= require("./testdata.js");

	before(function(done) {
		nano = require("../nanoMock.js")({
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

});
