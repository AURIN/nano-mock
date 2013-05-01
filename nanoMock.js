/**
 * nanoMock.js
 * 
 * Mock of Nano
 */
"use strict";

/**
 * Mock object replacing Nano (Node.js library for CouchDB) in unit tests.
 * testData are to be set by calling the setTestData method
 * 
 * @param cfg
 *          Is the usual Nano configuration object
 */
var nano;

module.exports = exports = nano = function database_module(cfg) {

	var events = require("events");
	var fs = require("fs");
	var public_functions = {}, request_opts = {}, db;
	var testData;

	// NOTE: This is a Nano extension
	function uuids(params, callback) {
		var response = new events.EventEmitter();
		setTimeout(function() {
			response.emit("end");
		}, 50);
		response.on("end", function(chunk) {
			return callback(null, {
				uuids : [ testData.test.uuids[2] ]
			});
		});
	}

	function create_db(db_name, callback) {
		return callback(null, {
			headers : {
				statusCode : 201
			}
		});
	}

	function destroy_db(db_name, callback) {
		return callback(null, {
			headers : {
				statusCode : 200
			}
		});
	}

	function get_db(db_name, callback) {
		return callback(null, {});
	}

	function list_dbs(callback) {
		return callback(null, [ "dstest", "datastore" ]);
	}

	function compact_db(db_name, design_name, callback) {
		return callback(null, {});
	}

	function changes_db(db_name, params, callback) {
		return callback(null, {});
	}

	function follow_db(db_name, params, callback) {
		return callback(null, {});
	}

	function replicate_db(source, target, opts, callback) {
		return callback(null, {});
	}

	function document_module(db_name) {

		var public_functions = {};

		function insert_doc(doc, params, callback) {
			var i;
			var docid = (typeof params === "object") ? params.doc_name : params;
			for (i = 0; i < testData.test.rows.length; i++) {
				if (testData.test.rows[i].datasetid === docid) {
					testData.test.rows[i].data.metadata.datastore.blobmetadata.timestamp = doc.data.metadata.datastore.blobmetadata.timestamp;
				}
			}

			var response = {
				headers : {
					statusCode : 200
				},
				id : doc.id,
				rev : "1"
			};

			if (docid || params.doc_name) {
				return callback(null, response);
			} else {
				return callback({}, response);
			}
		}

		function destroy_doc(docid, rev, callback) {
			var i;
			for (i = 0; i < testData.test.rows.length; i++) {
				if (testData.test.rows[i].datasetid === docid) {
					var response = new events.EventEmitter();
					setTimeout(function() {
						response.emit("end", testData.test.rows[i].data);
					}, 200);
					return callback(null, testData.test.rows[i].data);
				}
			}
			var err = {
				message : "Document not found",
			};
			err["status-code"] = 404;
			return callback(err, null);
		}

		function get_doc(docid, params, callback) {
			var i;
			var stream = new events.EventEmitter();
			if ((typeof params) === "function") {
				callback = params;
			}
			for (i = 0; i < testData.test.rows.length; i++) {
				if (testData.test.rows[i].datasetid === docid) {
					var response = new events.EventEmitter();
					if (params === null || typeof params === "undefined"
							|| typeof params.rev === "undefined") {
						testData.test.rows[i].data.metadata.datastore.blobmetadata.attachment = {
							id : testData.test.rows[i].datasetid,
							rev : "1"
						};
						return callback(null, {
							data : testData.test.rows[i].data,
							_attachments : {
								blob : testData.test.rows[i].rawdata
							}
						});
					} else {
						return callback(null, {
							metadata : {},
							_attachments : {
								blob : {
									length : 10
								}
							}
						});
					}
				}
			}
			var err = {
				message : "Document not found"
			};
			err["status-code"] = 404;
			return callback(err, null);
		}

		function head_doc(docid, callback) {
			var result = {
				etag : "\"0001\""
			};
			if (docid) {
				return callback(null, null, result);
			} else {
				var err = {
					message : "Missing ID"
				};
				err["status-code"] = 400;
				return callback(err, null, null);
			}
		}

		function copy_doc(doc_src, doc_dest, opts, callback) {
			return callback(null, {});
		}

		function list_docs(params, callback) {
			return callback(null, {});
		}

		function fetch_docs(doc_names, params, callback) {
			return callback(null, {});
		}

		function view_docs(design_name, view_name, params, callback) {
			var rows = new Array();
			var i;
			for (i = 0; i < testData.test.rows.length; i++) {
				rows.push({
					key : [],
					value : testData.test.rows[i]
				});
			}
			return callback(null, {
				rows : rows
			});
		}

		function show_doc(design_name, show_fn_name, docid, params, callback) {
			return callback(null, {});
		}

		function update_with_handler_doc(design_testname, update_name, callback) {
			return callback(null, {});
		}

		function bulk_docs(docs, params, callback) {
			return callback(null, {});
		}

		function insert_att(docid, attachmentName, att, contentType, params,
				callback) {
			var result = {
				id : docid,
				rev : "1"
			};

			if (docid && attachmentName && contentType) {
				callback(null, result);
			} else {
				var err = {
					message : "Document not found",
				};
				err["status-code"] = 404;
				callback(err, result);
			}
			return fs.createWriteStream("./target/test.xxx");
		}

		function get_att(docid, att_name, params, callback) {
			var i;
			for (i = 0; i < testData.test.rows.length; i++) {
				var value = testData.test.rows[i];
				if (value.datasetid === docid) {
					if (value.file) {
						var file = require("fs").createReadStream(value.file);
						callback(null);
						return file;
					}
				}
			}
			var err = {
				message : "Document not found",
			};
			err["status-code"] = 404;
			return callback(err, result);
		}

		function destroy_att(doc_name, att_name, rev, callback) {
			return callback(null, {});
		}

		public_functions = {
			info : function(cb) {
				return get_db(db_name, cb);
			},
			replicate : function(target, opts, cb) {
				return replicate_db(db_name, target, opts, cb);
			},
			compact : function(cb) {
				return compact_db(db_name, cb);
			},
			changes : function(params, cb) {
				return changes_db(db_name, params, cb);
			},
			follow : function(params, cb) {
				return follow_db(db_name, params, cb);
			},
			insert : insert_doc,
			get : get_doc,
			head : head_doc,
			copy : copy_doc,
			destroy : destroy_doc,
			bulk : bulk_docs,
			list : list_docs,
			fetch : fetch_docs,
			config : {
				url : cfg.url,
				db : db_name
			},
			attachment : {
				insert : insert_att,
				get : get_att,
				destroy : destroy_att
			},
			show : show_doc,
			atomic : update_with_handler_doc,
			updateWithHandler : update_with_handler_doc
		};

		public_functions.view = view_docs;
		public_functions.view.compact = function(design_name, cb) {
			return compact_db(db_name, design_name, cb);
		};

		return public_functions;
	}

	// server level exports
	public_functions = {
		db : {
			create : create_db,
			get : get_db,
			destroy : destroy_db,
			list : list_dbs,
			use : document_module,
			scope : document_module,
			compact : compact_db,
			replicate : replicate_db,
			changes : changes_db,
			follow : follow_db
		},
		use : document_module,
		scope : document_module,
		// Quick patch to tap into uuids, it'll work until the actual request object
		// is used for something else
		request : uuids,
		// NOTE This is just for the mock object
		setTestData : function setTestData(data) {
			testData = data;
		}
	};

	public_functions.config = cfg;

	// return document_module(db);

	return public_functions;
};