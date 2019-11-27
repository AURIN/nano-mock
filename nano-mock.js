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
const events = require ("events");
const fs = require ("fs");
const _ = require ("underscore");

module.exports = nano = function database_module (cfg) {

  var public_functions = {}, request_opts = {}, db;
  var testData;
  var testViews;
  var testLists;

  const findTestDoc = (docid) => {
    return _.find (testData.test.rows, (row) => {
      return row.datasetid === docid;
    });
  };

  const getErr = (testDoc) => {
    return (typeof testDoc.err === "undefined") ? null
      : testDoc.err;
  };

  const getInsertErr = (testDoc) => {
    return (typeof testDoc.err === "undefined") ? null
      : ((typeof testDoc.insertErr === "undefined") ? getErr (testDoc)
        : testDoc.insertErr);
  };

  // NOTE: This is a Nano extension
  function uuids (params, callback) {
    var response = new events.EventEmitter ();
    setTimeout (function () {
      response.emit ("end");
    }, 50);
    response.on ("end", function (chunk) {
      return callback (null, {
        uuids: [testData.test.uuids[2]]
      });
    });
  }

  function auth (user, pass, cb) {
    if (user === "xxx") {
      cb ({
        status_code: 401,
        message: "Name or password is incorrect"
      }, {}, {});
    } else {
      cb (null, {}, {});
    }
  }

  function create_db (db_name, callback) {
    return callback (null, {
      headers: {
        statusCode: 201
      }
    });
  }

  function destroy_db (db_name, callback) {
    return callback (null, {
      headers: {
        statusCode: 200
      }
    });
  }

  function get_db (db_name, callback) {
    return callback (null, {});
  }

  function list_dbs (callback) {
    return callback (null, ["dstest", "datastore"]);
  }

  function compact_db (db_name, design_name, callback) {
    return callback (null, {});
  }

  function changes_db (db_name, params, callback) {
    return callback (null, {});
  }

  function follow_db (db_name, params, callback) {
    return callback (null, {});
  }

  function replicate_db (source, target, opts, callback) {
    return callback (null, {});
  }

  function document_module (db_name) {

    var public_functions = {};

    function insert_doc (doc, params, rev, callbackIn) {

      var docid = (typeof params === "object" && params) ? params.doc_name
        : params;
      var callback = (typeof rev === "function") ? rev : callbackIn;
      var rev = (typeof rev === "function") ? params.rev : rev;
      var err = null;

      if (doc.views && doc.lists) {
        return callback (null, {
          headers: {
            statusCode: 200
          },
          id: docid,
          rev: "1"
        });
      }

      let testDoc = findTestDoc (docid);

      if (testDoc) {

        if (testDoc && testDoc.data && testDoc.data.metadata) {
          testDoc.data.metadata.datastore.blobmetadata.timestamp = doc.data.metadata.datastore.blobmetadata.timestamp;
        }

        if (testDoc && testDoc.inserted && !rev) {
          var err = {
            message: "Document conflict error",
          };
          err["status-code"] = 409;
          return callback (err, null);
        }

        var response = {
          headers: {
            statusCode: 200
          },
          id: docid,
          rev: "1"
        };

        if (testDoc.data && testDoc.data.metadata) {
          testDoc.inserted = true;
          testDoc.data.metadata.datastore.blobmetadata.timestamp = doc.data.metadata.datastore.blobmetadata.timestamp;
          return callback (getInsertErr (testDoc), response);
        }
      } else {
        testDoc = _.clone (doc);
        testDoc.inserted = true;
        testDoc.type = 'dataset';
        testDoc.datasetid = docid;
        testData.test.rows.push (testDoc);
        testDoc.data.metadata.datastore.blobmetadata.timestamp = doc.data.metadata.datastore.blobmetadata.timestamp;
        return callback (null, {
          headers: {
            statusCode: 201
          },
          id: docid,
          rev: "1"
        });
      }

      if (docid && testDoc) {
        var err = {
          message: "Document not found",
        };
        err["status-code"] = 404;
        response = null;
      } else {
        err = null;
        response = {
          id: docid,
          rev: "1"
        };
      }

      return callback (err, response);
    }

    function destroy_doc (docid, rev, callback) {
      const testDoc = findTestDoc (docid);
      if (testDoc) {
        var response = new events.EventEmitter ();
        testDoc.inserted = false;
        setTimeout (function () {
          response.emit ("end", testDoc.data);
        }, 200);
        return callback (null, testDoc.data);
      }

      var err = {
        message: "Document not found",
      };
      err["status-code"] = 404;
      return callback (err, null);
    }

    function get_doc (docid, params, callbackIn) {
      const testDoc = findTestDoc (docid);
      const stream = new events.EventEmitter ();
      const callback = (typeof params === "function") ? params : callbackIn;

      if (testDoc && testDoc.inserted) {
        var response = new events.EventEmitter ();
        if (params === null || typeof params === "undefined"
          || typeof params.rev === "undefined") {

          // Used only to test the datastore
          if (testDoc.data.metadata) {
            testDoc.data.metadata.datastore.blobmetadata.attachment = {
              _id: testDoc.datasetid,
              _rev: "10-eba93ccace15f970d9baa569cc4c4ab2"
            };
          }
          return callback (getErr (testDoc), {
            _id: docid,
            _rev: "10-eba93ccace15f970d9baa569cc4c4ab2",
            data: testDoc.data,
            _attachments: {
              blob: testDoc.rawdata
            }
          });
        } else {
          return callback (getErr (testDoc), {
            metadata: {},
            _attachments: {
              blob: {
                length: 10
              }
            }
          });
        }
      }

      var err = {
        message: "Document not found"
      };
      err["status-code"] = 404;
      return callback (err, null);
    };

    function head_doc (docid, callback) {
      var result = {
        etag: "\"0001\""
      };
      if (docid) {
        return callback (null, null, result);
      } else {
        var err = {
          message: "Missing ID"
        };
        err["status-code"] = 400;
        return callback (err, null, null);
      }
    }

    function copy_doc (doc_src, doc_dest, opts, callback) {
      return callback (null, {});
    }

    function list_docs (params, callback) {
      return callback (null, {});
    }

    function fetch_docs (doc_names, params, callback) {
      return callback (null, {});
    }

    function view_docs (design_name, view_name, params, callback) {

      var i, j;

      // If test views are defined, finds one with the given name and
      // executes it against test data
      if (testViews && testViews !== null) {
        for (j = 0; j < testViews.length; j++) {
          var view = testViews[j];

          if (view.name === (design_name + "/" + view_name)) {
            if (view.file) {
              view.rows = JSON.parse (fs.readFileSync (view.file));
            }
            return callback (null, {
              rows: _.filter (view.func (view.rows), (row) => {
                if (params && params.startkey && params.endkey) {
                  return row.key[0] >= params.startkey[0] && (row.key[0] <= params.endkey[0] || params.endkey[0] == null);
                } else {
                  return true;
                }
              }).sort ((a, b) => {
                if (a.key.join ('_') < b.key.join ('_')) {
                  return -1;
                }
                if (a.key.join ('_') > b.key.join ('_')) {
                  return 1;
                }
                return 0;
              }), headers: {status: 200}
            });
          }
        }
        return callback ({err: 404}, null);
      } else {
        // Default view returns all rows
        return callback (null, {
          rows: _.map (testData.test.rows, (row) => {
            return {
              key: [],
              value: row
            }
          }),
          headers: {
            status: 200
          }
        })
          ;
      }
    }

    function view_docs_with_list (design_name, view_name, list_name, params,
                                  callbackIn) {

      const callback = (typeof params === "function") ? params : callbackIn;
      var rows = new Array ();
      var i, j;

      // If test lists are defined, finds one with the given name and
      // executes it against test data returned by the view
      const list = _.find (testLists, (list) => {
        return list.name === [design_name, list_name].join ('/');
      });

      if (!list) {
        return callback ({
          err: 404
        }, {});
      }

      return (() => {
        const istream = new (require ('stream').Readable) ();
        istream._read = () => {
        };
        view_docs (design_name, view_name, params,
          (err, viewResult) => {
            var res = list.func (viewResult);
            callback (null, res.doc, res.headers);
            setTimeout (() => {
              istream.push (JSON.stringify (res.doc));
              istream.push (null);
            }, 500);
          });
        return istream;
      }) ();
    }

    function show_doc (design_name, show_fn_name, docid, params, callback) {
      return callback (null, {});
    }

    function update_with_handler_doc (design_testname, update_name, callback) {
      return callback (null, {});
    }

    function bulk_docs (docs, params, callback) {
      return callback (null, {});
    }

    function insert_att (docid, attachmentName, att, contentType, params,
                         callback) {
      const ofile = `/tmp/${docid}.json`;
      const ostream = fs.createWriteStream (ofile);
      var result = {
        id: docid,
        rev: "1"
      };
      if (docid && attachmentName && contentType) {
        callback (null, result);
      } else {
        var err = {
          message: "Document not found",
        };
        err["status-code"] = 404;
        callback (err, result);
      }

      ostream.on ('close', () => {
        const testDoc = findTestDoc (docid);
        if (testDoc) {
          testDoc.rawData = fs.readFileSync (ofile)
        }
      });
      return ostream;
    }

    function get_att (docid, att_name, params, callbackIn) {

      var callback = (typeof params === "function") ? params : callbackIn;
      const istream = new (require ('stream').Readable) ();
      istream._read = () => {
      };
      const testDoc = findTestDoc (docid);
      if (testDoc) {
        istream.push (testDoc.rawData);
        istream.push (null);
        return istream;
      }
      var err = {
        message: "Document not found",
      };
      err["status-code"] = 404;
      return callback (err);
    }

    function destroy_att (doc_name, att_name, rev, callback) {
      return callback (null, {});
    }

    public_functions = {
      info: function (cb) {
        return get_db (db_name, cb);
      },
      replicate: function (target, opts, cb) {
        return replicate_db (db_name, target, opts, cb);
      },
      compact: function (cb) {
        return compact_db (db_name, cb);
      },
      changes: function (params, cb) {
        return changes_db (db_name, params, cb);
      },
      follow: function (params, cb) {
        return follow_db (db_name, params, cb);
      },
      insert: insert_doc,
      get: get_doc,
      head: head_doc,
      copy: copy_doc,
      destroy: destroy_doc,
      bulk: bulk_docs,
      list: list_docs,
      fetch: fetch_docs,
      config: {
        url: cfg.url,
        db: db_name
      },
      attachment: {
        insert: insert_att,
        get: get_att,
        destroy: destroy_att
      },
      show: show_doc,
      atomic: update_with_handler_doc,
      updateWithHandler: update_with_handler_doc
    };

    public_functions.view = view_docs;
    public_functions.view_with_list = view_docs_with_list;
    public_functions.view.compact = function (design_name, cb) {
      return compact_db (db_name, design_name, cb);
    };

    return public_functions;
  }

// server level exports
  public_functions = {
    db: {
      create: create_db,
      get: get_db,
      destroy: destroy_db,
      list: list_dbs,
      use: document_module,
      scope: document_module,
      compact: compact_db,
      replicate: replicate_db,
      changes: changes_db,
      follow: follow_db,
    },
    auth: auth,
    use: document_module,
    scope: document_module,
    // Quick patch to tap into uuids, it'll work until the actual request object
    // is used for something else
    request: uuids,
    // NOTE: This is just for the mock object
    setTestData: function setTestData (data) {
      testData = data;
    },
    // NOTE: This is just for the mock object
    setTestViews: function setTestViews (views) {
      testViews = views;
    },
    // NOTE: This is just for the mock object
    setTestLists: function setTestLists (lists) {
      testLists = lists;
    }
  };

  public_functions.config = cfg;

  return public_functions;
}
;
