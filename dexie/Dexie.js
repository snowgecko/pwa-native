﻿/* Minimalistic IndexedDB Wrapper with Bullet Proof Transactions
   =============================================================
testing
   By David Fahlander, david.fahlander@gmail.com

   Version 0.9.3 - March 26, 2014.

   Tested successfully on Chrome, IE11, Firefox and Opera.

   Official Website: https://github.com/dfahlander/Dexie.js/wiki/Dexie.js

   Licensed under the Apache License Version 2.0, January 2004, http://www.apache.org/licenses/
*/
(function (window, publish, isBrowser, undefined) {

    "use strict";

    function Dexie(dbName) {

        // Resolve all external dependencies:
        var deps = Dexie.dependencies;
        var indexedDB = deps.indexedDB,
            IDBKeyRange = deps.IDBKeyRange,
            IDBTransaction = deps.IDBTransaction;

        var DOMError = deps.DOMError,
            TypeError = deps.TypeError,
            RangeError = deps.RangeError,
            Error = deps.Error;

        var dbTableSchema = null;
        var dbVersion = 0;
        var versions = [];
        var dbStoreNames = [];
        ///<var type="IDBDatabase" />
        var db = null;
        var dbOpenError = null;
        var isBeingOpened = false;
        var R = "readonly", RW = "readwrite";
        var iewa; // IE WorkAound needed in IE10 & IE11 for http://connect.microsoft.com/IE/feedback/details/783672/indexeddb-getting-an-aborterror-exception-when-trying-to-delete-objectstore-inside-onupgradeneeded
        var database = this;
        var mainTransactionFactory;
        var pausedResumeables = [];
        var use_proto = (function () { function F() { }; var a = new F(); try { a.__proto__ = Object.prototype; return !(a instanceof F) } catch (e) { return false; } })()

        function init() {
            mainTransactionFactory = new TransactionFactory().pause();
            pausedResumeables.push(mainTransactionFactory);
            // If browser (not node.js or other), subscribe to versionchange event and reload page
            if (isBrowser) database.on("versionchange", function (ev) {
                if (ev.newVersion && ev.newVersion > dbVersion) { // Only reload page if versionchange event isnt a deletion of database. Or if it's triggered with same verno as we already have due to delete/recreate calls.
                    // Default behavior for versionchange event is to reload the page.
                    // Caller can override this behavior by doing database.on("versionchange", function(){ return false; });
                    database.close();
                    window.location.reload(true);
                    /* The logic behind this default handler is:
                        1. Since this event means that the database is upgraded in another IDBDatabase instance (in tab or window that has a newer version of the code),
                           it makes sense to reload our page and force reload from cache. When reloaded, we get the newest version of the code - making app in synch with db.
                        2. There wont be an infinite loop here even if our page still get the old version, becuase the next time onerror will be triggered and not versionchange.
                        3. If not solving this by default, the API user would be obligated to handle versionchange, and would have to be on place in every example of Dexie code.
                    */
                };
            });
        }

        function extend(obj, extended) {
            Object.keys(extended).forEach(function (key) {
                obj[key] = extended[key];
            });
        }

        function derive(Child) {
            return {
                from: function (Parent) {
                    Child.prototype = Object.create(Parent.prototype);
                    Child.prototype.constructor = Child;
                    return {
                        extend: function (extension) {
                            extend(Child.prototype, extension);
                        }
                    };
                }
            };
        }

        //
        //
        //
        // ------------------------- Versioning Framework---------------------------
        //
        //
        //

        this.version = function (versionNumber) {
            /// <param name="versionNumber" type="Number"></param>
            /// <returns type="Version"></returns>
            if (db) throw new Error("Cannot add version when database is open");
            dbVersion = Math.max(dbVersion, versionNumber);
            var versionInstance = new Version(versionNumber);
            versions.push(versionInstance);
            return versionInstance;
        }

        function Version(versionNumber) {
            this._cfg = {
                version: versionNumber,
                tableSchema: null,
                schemaUpgrade: null,
                contentUpgrade: null,
            }
        }

        extend(Version.prototype, {
            stores: function (stores) {
                /// <summary>
                ///   Defines the schema for a particular version
                /// </summary>
                /// <param name="stores" type="Object">
                /// Example: <br/>
                ///   {users: "id++,first,last,&username,*email", <br/>
                ///   passwords: "id++,&username"}<br/>
                /// <br/>
                /// Syntax: {Table: "[primaryKey][++],[&][*]index1,[&][*]index2,..."}<br/><br/>
                /// Special characters:<br/>
                ///  "&"  means unique key, <br/>
                ///  "*"  means value is multiEntry, <br/>
                ///  "++" means auto-increment and only applicable for primary key <br/>
                /// </param>
                var tableSchema = (this._cfg.tableSchema = this._cfg.tableSchema || {});
                Object.keys(stores).forEach(function (tableName) {
                    var instanceTemplate = {};
                    var indexes = parseIndexSyntax(stores[tableName]);
                    var primKey = indexes.shift();
                    if (primKey.multi) throw new Error("Primary key cannot be multi-valued");
                    if (primKey.keyPath && primKey.auto) setByKeyPath(instanceTemplate, primKey.keyPath, 0);
                    indexes.forEach(function (idx) {
                        if (idx.auto) throw new Error ("Only primary key can be marked as autoIncrement (++)");
                        if (!idx.keyPath) throw new Error("Index must have a name and cannot be an empty string");
                        setByKeyPath(instanceTemplate, idx.keyPath, idx.compound ? idx.keyPath.map(function(){return ""}) : "");
                    });
                    tableSchema[tableName] = {
                        primKey: primKey,
                        indexes: indexes,
                        instanceTemplate: instanceTemplate
                    };
                });
                // Update the latest schema to this version
                var latestSchema = getCurrentTableSchema();
                if (dbTableSchema != latestSchema) {
                    // Update API
                    dbTableSchema = latestSchema;
                    removeTablesApi(database);
                    setApiOnPlace(database, mainTransactionFactory, ObjectMappableTable, Object.keys(latestSchema), latestSchema);
                }
                dbStoreNames = Object.keys(latestSchema);

                return this;
            },
            upgrade: function (upgradeFunction) {
                /// <param name="upgradeFunction" optional="true">Function that performs upgrading actions.</param>
                var self = this;
                fake(function () {
                    upgradeFunction(new WriteableTransaction(new TransactionFactory(), Object.keys(self._cfg.tableSchema))); // BUGBUG: No code completion for prev version's tables wont appear.
                });
                this._cfg.contentUpgrade = upgradeFunction;
                return this;
            }
        });

        function runUpgraders(oldVersion, trans, reject) {
            if (oldVersion == 0) {
                //dbTableSchema = versions[versions.length - 1]._cfg.tableSchema;
                // Create tables:
                Object.keys(dbTableSchema).forEach(function (tableName) {
                    createTable(trans, tableName, dbTableSchema[tableName].primKey, dbTableSchema[tableName].indexes);
                });
                // Populate data
                var tf = new MultireqTransactionFactory(trans);
                var t = new WriteableTransaction(tf, dbStoreNames);
                tf.dexieTrans = t;
                t.on("error", function (e) {
                    // Reject using descriptive error messages and not just the default errors from IDB (which are not so descriptive)
                    reject("Failed to populate database: " + e);
                }); 
                database.on("populate").fire(t);
            } else {
                // Upgrade version to version, step-by-step from oldest to newest version.
                // Each transaction object will contain the table set that was current in that version (but also not-yet-deleted tables from its previous version)
                var queue = [];
                dbTableSchema = null;
                var versToRun = versions.filter(function (v) { return v._cfg.version > oldVersion; });
                versToRun.forEach(function (version) {
                    /// <param name="version" type="Version"></param>
                    var oldSchema = dbTableSchema;
                    var newSchema = version._cfg.tableSchema;
                    dbTableSchema = newSchema;
                    if (!oldSchema) {
                        queue.push(function (trans, cb) {
                            // Create tables:
                            Object.keys(newSchema).forEach(function (tableName) {
                                createTable(trans, tableName, newSchema[tableName].primKey, newSchema[tableName].indexes);
                            });
                            cb();
                        });
                    } else {
                        var diff = getSchemaDiff(oldSchema, newSchema);
                        diff.add.forEach(function (tuple) {
                            queue.push(function (trans, cb) {
                                createTable(trans, tuple[0], tuple[1].primKey, tuple[1].indexes);
                            });
                            cb();
                        });
                        diff.change.forEach(function (change) {
                            if (change.recreate) {
                                // Recreate tables
                                if (hasIEDeleteObjectStoreBug()) {
                                    if (!iewa || !iewa[change.name]) {
                                        iewa = iewa || { __num: 0 };
                                        ++iewa.__num;
                                        iewa[change.name] = [];
                                        iterate(trans.objectStore(change.name).openCursor(), null, function (item) { iewa[change.name].push(item) }, function () {
                                            if (--iewa.__num == 0) {
                                                trans.abort(); // Abort transaction and re-open database re-run the upgraders now that all tables are read to mem.
                                                database.open();
                                            }
                                        });
                                    }
                                }

                                queue.push(function (trans, cb) {
                                    recreateTable(trans, change.name, change.def.primKey, change.def.indexes, cb);
                                });
                            } else {
                                queue.push(function (trans, cb) {
                                    var store = trans.objectStore(change.name);
                                    change.add.forEach(function (idx) {
                                        addIndex(store, idx);
                                    });
                                    change.change.forEach(function (idx) {
                                        store.deleteIndex(idx.name);
                                        addIndex(store, idx);
                                    });
                                    change.del.forEach(function (idxName) {
                                        store.deleteIndex(idxName);
                                    });
                                    cb();
                                });
                            }
                        });
                        if (newSchema._cfg.contentUpgrade) {
                            queue.push(function (trans, cb) {
                                var tf = new FinishableTransactionFactory(trans);
                                var t = new WriteableTransaction(trans, tf, trans.db.objectStoreNames);
                                tf.dexieTrans = t;
                                tf.onfinish = cb;
                                t.on("error", function (e) {
                                    // Forward descriptive error messages and not just the default errors from IDB (which are not so descriptive)
                                    reject ("Failed running upgrader function for version " + version._cfg.version + ": " + e);
                                });
                                newSchema._cfg.contentUpgrade(t);
                                if (tf.uncompleteRequests == 0) cb();
                            });
                        }
                        if (diff.del.length) {
                            if (!hasIEDeleteObjectStoreBug()) { // Dont delete old tables if ieBug is present. Let tables be left in DB so far. This needs to be taken care of.
                                queue.push(function (trans, cb) {
                                    // Delete old tables
                                    diff.del.forEach(function (tableName) {
                                        trans.db.deleteObjectStore(tableName);
                                    });
                                    cb();
                                });
                            }
                        }
                    }
                });

                // Now, create a queue execution engine
                var runNextQueuedFunction = function () {
                    if (queue.length)
                        queue.shift()(trans, runNextQueuedFunction);
                };

                if (iewa && iewa.__num > 0) return; // MSIE 10 & 11 workaround. Halt this run - we are in progress of copying tables into memory. When that is done, we will abort transaction and re-open database again.

                runNextQueuedFunction();
            }
        }

        function getSchemaDiff(oldSchema, newSchema) {
            var diff = {
                del: [], // Array of table names
                add: [], // Array of [tableName, newDefinition]
                change: [] // Array of {name: tableName, recreate: newDefinition, del: delIndexNames, add: newIndexDefs, change: changedIndexDefs}
            };
            for (var table in oldSchema) {
                if (!newSchema[table]) diff.del.push(table);
            }
            for (var table in newSchema) {
                var oldDef = oldSchema[table],
                    newDef = newSchema[table];
                if (!oldDef) diff.add.push([table, newDef]);
                else {
                    var change = {
                        name: table,
                        def: newSchema[table],
                        recreate: false,
                        del: [],
                        add: [],
                        change: []
                    };
                    if (oldDef.primKey.src != newDef.primKey.src) {
                        // Primary key has changed. Remove and re-add table.
                        change.recreate = true;
                        diff.change.push(change);
                    } else {
                        var oldIndexes = oldDef.indexes.reduce(function (prev, current) { prev[current.name] = current; return prev; }, {});
                        var newIndexes = newDef.indexes.reduce(function (prev, current) { prev[current.name] = current; return prev; }, {});
                        for (var idxName in oldIndexes) {
                            if (!newIndexes[idxName]) change.del.push(idxName);
                        }
                        for (var idxName in newIndexes) {
                            var oldIdx = oldIndexes[idxName],
                                newIdx = newIndexes[idxName];
                            if (!oldIdx) change.add.push(newIdx);
                            else if (oldIdx.src != newIdx.src) change.change.push(newIdx);
                        }
                        if (change.recreate || change.del.length > 0 || change.add.length > 0 || change.change.length > 0) {
                            diff.change.push(change);
                        }
                    }
                }
            }
            return diff;
        }


        function copyTable(oldStore, newStore, cb) {
            /// <param name="oldStore" type="IDBObjectStore"></param>
            /// <param name="newStore" type="IDBObjectStore"></param>
            iterate(oldStore.openCursor(), null, function (item) {
                newStore.add(item);
            }, cb);
        }

        function createTable(trans, tableName, primKey, indexes) {
            /// <param name="trans" type="IDBTransaction"></param>
            var store = trans.db.createObjectStore(tableName, { keyPath: primKey.keyPath, autoIncrement: primKey.auto });
            indexes.forEach(function (idx) { addIndex(store, idx); });
            return store;
        }

        function addIndex(store, idx) {
            store.createIndex(idx.name, idx.keyPath, { unique: idx.unique, multiEntry: idx.multi });
        }

        function recreateTable(trans, tableName, primKey, indexes, cb) {
            /// <param name="trans" type="IDBTransaction"></param>
            if (iewa) {
                //trans.db.deleteObjectStore(tableName);
                var store = createTable(trans, tableName, primKey, indexes);
                iewa[tableName].forEach(function (item) {
                    store.add(item);
                });
                delete iewa[tableName];
                if (Object.keys(iewa).length == 0) iewa = null;
                cb();
            } else {
                // Create temp table
                var tmpStore = createTable(trans, "_temp-" + tableName, primKey, []);
                // Copy old to temp
                copyTable(trans.objectStore(tableName), tmpStore, function () {
                    // Delete old
                    trans.db.deleteObjectStore(tableName);
                    // Create new
                    var recreatedStore = createTable(trans, tableName, primKey, indexes);
                    // Copy temp to new
                    copyTable(tmpStore, recreatedStore, function () {
                        // Delete temp
                        trans.db.deleteObjectStore("_temp-" + tableName);
                        cb();
                    });
                });
            }
        }


        //
        //
        //
        //
        //      Dexie API
        //
        //
        //

        this.open = function () {
            return new Promise(function (resolve, reject) {
                if (db) throw new Error("Database already open");
                function openError(err) {
                    isBeingOpened = false;
                    dbOpenError = err;
                    reject(dbOpenError);
                    pausedResumeables.forEach(function (tf) {
                        // Resume all stalled operations. They will fail once they wake up.
                        tf.resume();
                    });
                }
                try {
                    dbOpenError = null;
                    isBeingOpened = true;

                    // Make sure caller has specified at least one version
                    if (versions.length == 0) throw new Error("No versions specified. Need to call version(ver) method");
                    // Make sure at least the oldest version specifies a table schema
                    if (!versions[0]._cfg.tableSchema) throw new Error("No schema specified. Need to call dbInstance.version(ver).stores(schema) on at least the lowest version.");
                    // Sort versions and make all Version instances have a schema (its own or previous if not specified)
                    versions.sort(lowerVersionFirst).reduce(function (prev, ver) {
                        if (!ver._cfg.tableSchema) ver._cfg.tableSchema = prev._cfg.tableSchema;
                        return ver;
                    });
            
                    // Multiply dbVersion with 10 will be needed to workaround upgrading bug in IE: 
                    // IE fails when deleting objectStore after reading from it.
                    // A future version of Dexie.js will stopover an intermediate version to workaround this.
                    // At that point, we want to be backward compatible. Could have been multiplied with 2, but by using 10, it is easier to map the number to the real version number.
                    if (!indexedDB) throw new Error("indexedDB API not found. If using IE10+, make sure to run your code on a server URL (not locally). If using Safari, make sure to include indexedDB polyfill.");
                    var req = indexedDB.open(dbName, dbVersion * 10); 
                    req.onerror = eventToError(openError);
                    req.onblocked = database.on("blocked").fire;
                    req.onupgradeneeded = function (e) {
                        req.transaction.onerror = eventToError(reject);
                        runUpgraders(e.oldVersion / 10, req.transaction, reject);
                    };
                    req.onsuccess = function (e) {
                        isBeingOpened = false;
                        db = req.result;
                        db.onversionchange = database.on("versionchange").fire;
                        pausedResumeables.forEach(function (tf) {
                            // If anyone has made operations on a table instance before the database was opened, the operations will start executing now.
                            tf.resume();
                        });
                        pausedResumeables = [];
                    };
                } catch (err) {
                    openError(err);
                }
            });
        }

        this._backendDB = function () {
            return db;
        }

        this.close = function () {
            if (db) {
                db.close();
                pausedResumeables.push(mainTransactionFactory.pause());
                db = null;
                dbOpenError = null;
            }
        }

        this.delete = function () {
            return new Promise(function (resolve, reject) {
                function doDelete() {
                    database.close();
                    var req = indexedDB.deleteDatabase(dbName);
                    req.onsuccess = resolve;
                    req.onerror = reject;
                    req.onblocked = database.on("blocked").fire;
                }
                if (isBeingOpened) {
                    pausedResumeables.push({resume: doDelete});
                } else {
                    doDelete();
                }
            });
        }

        //
        // Events: populate, ready and error
        //

        this.on = events(this, "error", "ready", "populate", "blocked", "versionchange");

        fake(function () {
            database.on("populate").fire(new WriteableTransaction(new TransactionFactory(), dbStoreNames));
            database.on("error").fire(new Error());
        });

        this.transaction = function (mode, tableInstances, scopeFunc) {
            /// <summary>
            /// 
            /// </summary>
            /// <param name="mode" type="String">"r" for readonly, or "rw" for readwrite</param>
            /// <param name="tableInstances">Table instance, Array of Table instances, String or String Array of object stores to include in the transaction</param>
            /// <param name="scopeFunc" type="Function">Function to execute with transaction</param>
            tableInstances = [].slice.call(arguments, 1, arguments.length - 1);
            scopeFunc = arguments[arguments.length - 1];
            return new Promise(function (resolve, reject) {
                var tables = Array.isArray(tableInstances[0]) ? tableInstances.reduce(function (a, b) { return a.concat(b) }) : tableInstances;
                var storeNames = tables.map(function (tableInstance) {
                    if (typeof (tableInstance) == "string") {
                        if (!dbTableSchema[tableInstance]) { throw new Error("Invalid table name: " + tableInstance); return { INVALID_TABLE_NAME: 1 } }; // Return statement is for IDE code completion.
                        return tableInstance;
                    } else {
                        if (!(tableInstance instanceof Table)) { throw new TypeError("Invalid type. Arguments following mode must be instances of Table or String"); return { IVALID_TYPE: 1 }; }
                        return tableInstance._name;
                    }
                });
                var tf, trans;
                if (mode == R || mode == "r") {
                    tf = new MultireqTransactionFactory(storeNames, R);
                    trans = new Transaction(tf, storeNames);
                } else if (mode == RW || mode == "rw") {
                    tf = new MultireqTransactionFactory(storeNames, RW);
                    trans = new WriteableTransaction(tf, storeNames);
                } else {
                    throw new RangeError("Invalid mode. Only 'readonly'/'r' or 'readwrite'/'rw' are valid modes.");
                }
                tf.dexieTrans = trans;
                if (!db && !dbOpenError) {
                    pausedResumeables.push(tf.pause());
                }
                var args = storeNames.map(function (name) { return trans[name]; });
                args.push(trans);

                trans.complete(resolve).error(function (e) {
                    var catched = reject(e);
                    if (!catched) database.on("error").fire(e); // If not catched, bubble error to database.on("error").
                });
                try {
                    scopeFunc.apply(null, args);
                } catch (e) {
                    trans.abort();
                    reject(e);
                }
            });
        }

        this.table = function (tableName) {
            if (Object.keys(dbTableSchema).indexOf(tableName) == -1) { throw new Error ("Table does not exist"); return { AN_UNKNOWN_TABLE_NAME_WAS_SPECIFIED: 1 }; }
            return new ObjectMappableTable(tableName, mainTransactionFactory);
        }

        //
        //
        //
        // ------------------------- Table Object ---------------------------
        //
        //
        //
        function Table(name, transactionFactory, collClass) {
            /// <param name="name" type="String"></param>
            /// <param name="transactionFactory" type="TransactionFactory">TransactionFactory or MultireqTransactionFactory</param>
            this._name = name;
            this._tf = transactionFactory;
            this._collClass = collClass || Collection;
        }

        derive(Table).from(Dexie.Table).extend({
            get: function (key, cb) {
                var self = this;
                fake(function () { cb(getInstanceTemplate(self._name)) });
                return this._tf.createPromise(function (resolve, reject) {
                    var req = self._tf.create(self._name).objectStore(self._name).get(key);
                    req.onerror = eventRejectHandler(reject, ["getting", key, "from", self._name]);
                    req.onsuccess = function () {
                        var mappedClass = database[self._name]._mappedClass;
                        if (mappedClass) {
                            var result = req.result;
                            if (!result) {
                                resolve(result);
                            } else if (use_proto) {
                                result.__proto__ = mappedClass.prototype;
                                resolve(result);
                            } else {
                                var res = Object.create(mappedClass.prototype);
                                for (var m in result) res[m] = result[m];
                                resolve(res);
                            }
                        } else {
                            resolve(req.result);
                        }
                    };
                }).then(cb);
            },
            where: function (indexName) {
                return new WhereClause(this._tf, this._name, indexName);
            },
            count: function (cb) {
                return new Collection(new WhereClause(this._tf, this._name)).count(cb);
            },
            limit: function (numRows) {
                return new this._collClass(new WhereClause(this._tf, this._name)).limit(numRows);
            },
            each: function (fn) {
                var self = this;
                fake(function () { fn(getInstanceTemplate(self._name)) });
                return this._tf.createPromise(function (resolve, reject) {
                    var req = self._tf.create(self._name).objectStore(self._name).openCursor();
                    req.onerror = eventRejectHandler(reject, ["calling", "Table.each()", "on", self._name]);
                    iterate(req, null, fn, resolve, reject, self._mappedClass && self._mappedClass.prototype);
                });
            },
            toArray: function (cb) {
                var self = this;
                fake(function () { cb([getInstanceTemplate(self._name)]) });
                return this._tf.createPromise(function (resolve, reject) {
                    var a = [];
                    var req = self._tf.create(self._name).objectStore(self._name).openCursor();
                    req.onerror = eventRejectHandler(reject, ["calling", "Table.toArray()", "on", self._name]);
                    iterate(req, null, function (item) { a.push(item); }, function () { resolve(a); }, reject, self._mappedClass && self._mappedClass.prototype);
                }).then(cb);
            },
            orderBy: function (index) {
                return new this._collClass(new WhereClause(this._tf, this._name, index));
            }
        });

        //
        //
        //
        // ------------------------- class WriteableTable extends Table ---------------------------
        //
        //
        //
        function WriteableTable(name, transactionFactory) {
            /// <param name="name" type="String"></param>
            /// <param name="transactionFactory" type="TransactionFactory">TransactionFactory or MultireqTransactionFactory</param>
            Table.call(this, name, transactionFactory, WriteableCollection);
        }

        derive(WriteableTable).from(Table).extend({

            _wrop: function (method, args, onReqSuccess, errsentance) {
                /// <summary>
                ///  Perform a write operation on object store.
                /// </summary>
                var self = this,
                    tf = this._tf;

                return tf.createPromise(function (resolve, reject) {
                    var trans = tf.create(self._name, RW);
                    var store = trans.objectStore(self._name);
                    var req = store[method].apply(store, args || []);
                    req.onerror = eventRejectHandler(reject, errsentance);
                    if (tf.oneshot) {
                        // Transaction is a one-shot transaction and caller has not access to it. This is the case when calling
                        // put(),add() etc directy on db.table and not via db.transaction(). Let the promise.then() be called when transaction
                        // completes and not just when request completes. Otherwise caller will continue before the data has been transmitted to the database.
                        trans.oncomplete = function () {
                            resolve(req.result);
                        }
                        if (onReqSuccess) req.onsuccess = onReqSuccess;
                    } else {
                        // Caller has the transaction object. then() must be called when request.onsuccess.
                        // This is because caller must be able to continue doing operations on the transaction that is already open.
                        // Also, if caller will read from recently stored data within the same transaction, he or she will get it.
                        // But if caller reads same data from another transaction, it may not be retrieved yet.
                        if (onReqSuccess) {
                            req.onsuccess = function () {
                                onReqSuccess.apply(this, arguments);
                                resolve(req.result);
                            }
                        } else {
                            req.onsuccess = function () {
                                resolve(req.result);
                            }
                        }
                    }
                });
            },


            put: function (obj) {
                /// <summary>
                ///   Add an object to the database but in case an object with same primary key alread exists, the existing one will get updated.
                /// </summary>
                /// <param name="obj" type="Object">A javascript object to insert or update</param>
                return this._wrop("put", [obj], function (ev) {
                    var keyPath = ev.target.source.keyPath;
                    if (keyPath) setByKeyPath(obj, keyPath, ev.target.result);
                }, ["putting", obj, "into", this._name]);
            },
            add: function (obj) {
                /// <summary>
                ///   Add an object to the database. In case an object with same primary key already exists, the object will not be added.
                /// </summary>
                /// <param name="obj" type="Object">A javascript object to insert</param>
                return this._wrop("add", [obj], function (ev) {
                    var keyPath = ev.target.source.keyPath;
                    if (keyPath) setByKeyPath(obj, keyPath, ev.target.result);
                }, ["adding", obj, "into", this._name]);
            },
            'delete': function (key) {
                /// <param name="key">Primary key of the object to delete</param>
                return this._wrop("delete", [key], null, ["deleting", key, "from", this._name]);
            },
            clear: function () {
                return this._wrop("clear", [], null, ["clearing", this._name]);
            },
            where: function (indexName) {
                return new WhereClause(this._tf, this._name, indexName, WriteableCollection);
            },
            modify: function (changes) {
                return new WriteableCollection(new WhereClause(this._tf, this._name, null, WriteableCollection)).modify(changes);
            }
        });

        function ObjectMappableTable(name, transactionFactory) {
            WriteableTable.call(this, name, transactionFactory);
        }

        (function () {

            function parseType(type) {
                if (typeof (type) == 'function') {
                    return new type();
                } else if (Array.isArray(type)) {
                    return [parseType(type[0])];
                } else if (typeof (type) == 'object') {
                    var rv = {};
                    applyStructure(rv, type);
                    return rv;
                } else {
                    return type;
                }
            }

            function applyStructure(obj, structure) {
                Object.keys(structure).forEach(function (member) {
                    obj[member] = parseType(structure[member]);
                });
            }

            derive(ObjectMappableTable).from(WriteableTable).extend({
                mapToClass: function (constructor, structure) {
                    /// <summary>
                    ///     Map table to a javascript constructor function. Objects returned from the database will be instances of this class, making
                    ///     it possible to the instanceOf operator as well as extending the class using constructor.prototype.method = function(){...}.
                    /// </summary>
                    /// <param name="constructor">Constructor function representing the class.</param>
                    /// <param name="structure" optional="true">Helps IDE code completion by knowing the members that objects contain and not just the indexes. Also
                    /// know what type each member has. Example: {name: String, emailAddresses: [String], password}</param>
                    var mappedClass = this._mappedClass = constructor;
                    this._instanceTemplate = Object.create(mappedClass.prototype);
                    if (structure) {
                        applyStructure(this._instanceTemplate, structure);
                    }
                    return constructor;
                },
                defineClass: function (structure) {
                    /// <summary>
                    ///     Define all members of the class that represents the table. This will help code completion of when objects are read from the database
                    ///     as well as making it possible to extend the prototype of the returned constructor function.
                    /// </summary>
                    /// <param name="structure">Helps IDE code completion by knowing the members that objects contain and not just the indexes. Also
                    /// know what type each member has. Example: {name: String, emailAddresses: [String], password}</param>
                    var template = {};
                    applyStructure(template, structure);
                    var primKeyName = dbTableSchema[this._name].primKey.keyPath;
                    this._mappedClass = function () {
                        for (var m in template) if (m != primKeyName) this[m] = template[m];
                    };
                    this._instanceTemplate = template;
                    return this._mappedClass;
                }
            });
        })();

        function Transaction(tf, storeNames, tableClass) {
            /// <summary>
            ///    Transaction class
            /// </summary>
            /// <param name="trans" type="IDBTransaction">The underlying transaction instance</param>
            /// <param name="tf">Transaction factory</param>
            /// <param name="storeNames" type="Array">Array of table names to operate on</param>
            /// <param name="tableClass" optional="true" type="Function">Class to use for table instances</param>
            this._ctx = {
                tf: tf,
                storeNames: storeNames,
                tableClass: tableClass || Table
            };

            this.on = events(this, ["complete", "error"], "abort");
            this.complete = function (cb) {return this.on("complete", cb);}
            this.error = function (cb) { return this.on("error", cb); }

            tf.dexieTrans = this;

            setApiOnPlace(this, tf, tableClass || Table, storeNames);
        }

        derive(Transaction).from(Dexie.Transaction).extend({
            abort: function () {
                if (this._ctx.tf.trans && !this._ctx.tf.inactive) try {
                    this._ctx.tf.inactive = true;
                    this._ctx.tf.trans.abort();
                } catch (e) { }
            },
            table: function (name) {
                if (Array.prototype.indexOf.call(this._ctx.storeNames, name) == -1) throw new Error ("Table does not exist");
                return new this._ctx.tableClass(name, this._ctx.tf);
            }
        });

        function WriteableTransaction(tf, storeNames) {
            /// <summary>
            ///     Transaction class with WriteableTable instances instead of readonly Table instances.
            /// </summary>
            /// <param name="trans" type="IDBTransaction">The underlying transaction instance</param>
            /// <param name="tf">Transaction factory</param>
            /// <param name="storeNames" type="Array">Array of table names to operate on</param>
            Transaction.call(this, tf, storeNames, WriteableTable);
        }

        derive(WriteableTransaction).from(Transaction);



        //
        //
        //
        // ------------------------- WhereClause ---------------------------
        //
        //
        //

        function WhereClause(tf, table, index, collectionClass, orCollection) {
            /// <param name="tf" type="TransactionFactory"></param>
            /// <param name="table" type="String"></param>
            /// <param name="index" type="String"></param>
            this._ctx = {
                tf: tf,
                table: table,
                index: index,
                collClass: collectionClass || Collection,
                or: orCollection
            }
        }

        (function () {
            // WhereClause private methods

            function fail(collection, err) {
                try { throw err; } catch (e) {
                    collection._ctx.error = e;
                }
                return collection;
            }

            function getSortedSet(args) {
                return Array.prototype.slice.call(Array.isArray(args[0]) ? args[0] : args, 0).sort();
            }

            function upperFactory(dir) {
                return dir === "next" ? function(s){return s.toUpperCase();} : function(s){return s.toLowerCase();}
            }
            function lowerFactory(dir) {
                return dir === "next" ? function(s){return s.toLowerCase();} : function(s){return s.toUpperCase();}
            }
            function nextCasing(key, lowerKey, upperNeedle, lowerNeedle, cmp, dir) {
                var length = Math.min(key.length, lowerNeedle.length);
                var llp = -1;
                for (var i = 0; i < length; ++i) {
                    var lwrKeyChar = lowerKey[i];
                    if (lwrKeyChar !== lowerNeedle[i]) {
                        if (cmp(key[i], upperNeedle[i]) < 0) return key.substr(0, i) + upperNeedle[i] + upperNeedle.substr(i + 1);
                        if (cmp(key[i], lowerNeedle[i]) < 0) return key.substr(0, i) + lowerNeedle[i] + upperNeedle.substr(i + 1);
                        if (llp >= 0) return key.substr(0, llp) + lowerKey[llp] + upperNeedle.substr(llp + 1);
                        return null;
                    }
                    if (cmp(key[i], lwrKeyChar) < 0) llp = i;
                }
                if (length < lowerNeedle.length && dir === "next") return key + upperNeedle.substr(key.length);
                if (length < key.length && dir === "prev") return key.substr(0, upperNeedle.length);
                return (llp < 0 ? null : key.substr(0, llp) + lowerNeedle[llp] + upperNeedle.substr(llp + 1));
            }

            function addIgnoreCaseAlgorithm(c, match, needle) {
                /// <param name="needle" type="String"></param>
                var upper, lower, compare, upperNeedle, lowerNeedle, direction;
                function initDirection(dir) {
                    upper = upperFactory(dir);
                    lower = lowerFactory(dir);
                    compare = (dir === "next" ? ascending : descending);
                    upperNeedle = upper(needle);
                    lowerNeedle = lower(needle);
                    direction = dir;
                }
                initDirection("next");
                c._ondirectionchange = function (direction) {
                    // This event onlys occur before filter is called the first time.
                    initDirection(direction);
                };
                c._addAlgorithm(function (cursor, advance, resolve) {
                    /// <param name="cursor" type="IDBCursor"></param>
                    /// <param name="advance" type="Function"></param>
                    /// <param name="resolve" type="Function"></param>
                    var key = cursor.key;
                    if (typeof (key) !== 'string') return false;
                    var lowerKey = lower(key);
                    if (match(lowerKey, lowerNeedle)) {
                        advance(function () { cursor.continue(); });
                        return true;
                    } else {
                        var nextNeedle = nextCasing(key, lowerKey, upperNeedle, lowerNeedle, compare, direction);
                        if (nextNeedle) {
                            advance(function () { cursor.continue(nextNeedle); });
                        } else {
                            advance(resolve);
                        }
                        return false;
                    }
                });
            }

            // WhereClause public methods
            derive(WhereClause).from(Dexie.WhereClause).extend ({
                between: function (lower, upper, includeLower, includeUpper) {
                    /// <summary>
                    ///     Filter out records whose where-field lays between given lower and upper values. Applies to Strings, Numbers and Dates.
                    /// </summary>
                    /// <param name="lower"></param>
                    /// <param name="upper"></param>
                    /// <param name="includeLower" optional="true">Whether items that equals lower should be included. Default true.</param>
                    /// <param name="includeUpper" optional="true">Whether items that equals upper should be included. Default false.</param>
                    /// <returns type="Collection"></returns>
                    includeLower = includeLower !== false;   // Default to true
                    includeUpper = includeUpper === true;    // Default to false
                    if ((lower > upper) ||
                        (lower == upper && (includeLower || includeUpper) && !(includeLower && includeUpper)))
                        return new Collection(this, IDBKeyRange.only(lower)).limit(0); // Workaround for idiotic W3C Specification that DataError must be thrown if lower > upper. The natural result would be to return an empty collection.
                    return new this._ctx.collClass(this, IDBKeyRange.bound(lower, upper, !includeLower, !includeUpper));
                },
                equals: function (value) {
                    return new this._ctx.collClass(this, IDBKeyRange.only(value));
                },
                above: function (value) {
                    return new this._ctx.collClass(this, IDBKeyRange.lowerBound(value, true));
                },
                aboveOrEqual: function (value) {
                    return new this._ctx.collClass(this, IDBKeyRange.lowerBound(value));
                },
                below: function (value) {
                    return new this._ctx.collClass(this, IDBKeyRange.upperBound(value, true));
                },
                belowOrEqual: function (value) {
                    return new this._ctx.collClass(this, IDBKeyRange.upperBound(value));
                },
                startsWith: function (str) {
                    /// <param name="str" type="String"></param>
                    if (typeof (str) != 'string') return fail(new Collection(this), new TypeError("String expected"));
                    return this.between(str, str + String.fromCharCode(65535), true, true);
                },
                startsWithIgnoreCase: function (str) {
                    /// <param name="str" type="String"></param>
                    if (typeof (str) != 'string') return fail(new Collection(this), new TypeError("String expected"));
                    if (str === "") return this.startsWith(str);
                    var c = new this._ctx.collClass(this);
                    addIgnoreCaseAlgorithm(c, function (a, b) { return a.indexOf(b) === 0; }, str);
                    c._ondirectionchange = function () { fail(c, new Error("desc() not supported with WhereClause.startsWithIgnoreCase()")); };
                    return c;
                },
                equalsIgnoreCase: function (str) {
                    /// <param name="str" type="String"></param>
                    if (typeof (str) != 'string') return fail(new Collection(this), new TypeError("String expected"));
                    var c = new this._ctx.collClass(this);
                    addIgnoreCaseAlgorithm(c, function (a, b) { return a === b; }, str);
                    return c;
                },
                anyOf: function (valueArray) {
                    var set = getSortedSet(arguments); 
                    var c = new this._ctx.collClass(this);
                    var sorter = ascending;
                    c._ondirectionchange = function (direction) {
                        sorter = (direction === "next" ? ascending : descending);
                        set.sort(sorter);
                    };
                    var i = 0;
                    c._addAlgorithm(function (cursor, advance, resolve) {
                        var key = cursor.key;
                        while (sorter(key, set[i]) > 0) {
                            // The cursor has passed beyond this key. Check next.
                            ++i;
                            if (i === set.length) {
                                // There is no next. Stop searching.
                                advance(resolve);
                                return false;
                            }
                        }
                        if (key === set[i]) {
                            // The current cursor value should be included and we should continue a single step in case next item has the same key or possibly our next key in set.
                            advance(function () { cursor.continue(); });
                            return true;
                        } else {
                            // cursor.key not yet at set[i]. Forward cursor to the next key to hunt for.
                            advance(function () { cursor.continue(set[i]); });
                            return false;
                        }
                    });
                    return c;
                }
            });
        })();




        //
        //
        //
        // ------------------------- Collection ---------------------------
        //
        //
        //

        function Collection(whereClause, keyRange) {
            /// <summary>
            /// 
            /// </summary>
            /// <param name="whereClause" type="WhereClause">Where clause instance</param>
            /// <param name="keyRange" type="IDBKeyRange" optional="true"></param>
            var whereCtx = whereClause._ctx;
            this._ctx = {
                tf: whereCtx.tf,
                table: whereCtx.table,
                index: whereCtx.index,
                range: keyRange,
                op: "openCursor",
                dir: "next",
                unique: "",
                algorithm: null,
                filter: null,
                offset: 0,
                limit: Infinity,
                /// <field type="IDBTransaction" />
                trans: null,
                oneshot: whereCtx.tf.oneshot,
                error: null, // If set, any promise must be rejected with this error
                or: whereCtx.or
            }
        }

        derive(Collection).from(Dexie.Collection).extend({
            _addFilter: function (fn) {
                var ctx = this._ctx;
                ctx.filter = combine(ctx.filter, fn);
            },

            _addAlgorithm: function (fn) {
                var ctx = this._ctx;
                ctx.algorithm = combine(ctx.algorithm, fn);
            },

            _getIndexOrStore: function (mode) {
                var ctx = this._ctx;
                ctx.trans = ctx.tf.create(ctx.table, mode || R);
                var store = ctx.trans.objectStore(ctx.table),
                    index = ctx.index;
                return (!index || (store.keyPath && index === store.keyPath)) ? store : store.index(index);
            },

            _openCursor: function (mode) {
                var ctx = this._ctx;
                return this._getIndexOrStore(mode)[ctx.op](ctx.range || null, ctx.dir + ctx.unique);
            },
            
            _promise: function (fn, cb) {
                var ctx = this._ctx;
                function rejector(resolve, reject) { asap(function () { reject(ctx.error); }) };
                if (ctx.error) {
                    return ctx.tf.createPromise(rejector);
                } else {
                    return ctx.tf.createPromise(fn).then(cb);
                }
            },

            _iterate: function (fn, resolve, reject, mode) {
                var self = this,
                    ctx = this._ctx,
                    mappedClass = database[ctx.table]._mappedClass;
                
                if (!ctx.or) {
                    iterate(this._openCursor(mode), combine(ctx.algorithm, ctx.filter), fn, resolve, reject, mappedClass && mappedClass.prototype);
                } else {
                    (function () {
                        var filter = ctx.filter;
                        var set = {};
                        var primKey = dbTableSchema[ctx.table].primKey.keyPath;
                        var resolved = 0;

                        function resolveboth() {
                            if (++resolved === 2) resolve(); // Seems like we just support or btwn max 2 expressions, but there are no limit because we do recursion.
                        }

                        function union(item, cursor, advance) {
                            if (!filter || filter(cursor, advance, resolveboth, reject)) {
                                var key = JSON.stringify(getByKeyPath(item, primKey));
                                if (!set.hasOwnProperty(key)) {
                                    set[key] = true;
                                    fn(item, cursor, advance);
                                }
                            }
                        }

                        ctx.or._iterate(union, resolveboth, reject, mode);
                        iterate(self._openCursor(mode), ctx.algorithm, union, resolveboth, reject, mappedClass && mappedClass.prototype);
                    })();
                }
            },

            each: function (fn) {
                var self = this,
                    ctx = this._ctx;

                fake(function () { fn(getInstanceTemplate(ctx.table)); });

                return this._promise(function (resolve, reject) {
                    self._iterate(fn, resolve, reject);
                });
            },

            count: function (cb) {
                fake(function () { cb(0); });
                var self = this,
                    ctx = this._ctx;

                if (ctx.filter || ctx.algorithm || ctx.or) {
                    // When filters are applied or 'ored' collections are used, we must count manually
                    var count = 0;
                    return this._promise(function (resolve, reject) {
                        self._iterate(function () { ++count; return false; }, function () { resolve(count); }, reject);
                    }, cb);
                } else {
                    // Otherwise, we can use the count() method if the index.
                    return this._promise(function (resolve, reject) {
                        var idx = self._getIndexOrStore();
                        var req = (ctx.range ? idx.count(ctx.range) : idx.count());
                        req.onerror = eventRejectHandler(reject, ["calling", "count()", "on", self._name]);
                        req.onsuccess = function (e) {
                            resolve(Math.min(e.target.result, Math.max(0, self._ctx.limit - self._ctx.offset)));
                        }
                    }, cb);
                }
            },

            sortBy: function (keyPath, cb) {
                /// <param name="keyPath" type="String"></param>
                var ctx = this._ctx;
                fake(function () { cb([getInstanceTemplate(ctx.table)]); });
                var parts = keyPath.split('.').reverse(),
                    lastPart = parts[0],
                    lastIndex = parts.length - 1;
                function getval(obj, i) {
                    if (i) return getval(obj[parts[i]], i - 1);
                    return obj[lastPart];
                }
                var order = this._ctx.dir === "next" ? 1 : -1;
                
                function sorter (a, b) {
                    var aVal = getval(a, lastIndex),
                        bVal = getval(b, lastIndex);
                    return aVal < bVal ? -order : aVal > bVal ? order : 0;
                }
                return this.toArray(function (a) {
                    return a.sort(sorter);
                }).then(cb);
            },

            toArray: function (cb) {
                var self = this,
                    ctx = this._ctx;
                fake(function () { cb([getInstanceTemplate(ctx.table)]); });

                return this._promise(function (resolve, reject) {
                    var a = [];
                    self._iterate(function (item) { a.push(item); }, function arrayComplete() {
                        resolve(a);
                    }, reject);
                }, cb);
            },

            offset: function (offset) {
                var ctx = this._ctx;
                if (offset <= 0) return this;
                ctx.offset += offset; // For count()
                if (!ctx.or && !ctx.algorithm && !ctx.filter) {
                    this._addFilter(function offsetFilter(cursor, advance, resolve) {
                        if (offset === 0) return true;
                        if (offset === 1) { --offset; return false; }
                        advance(function () { cursor.advance(offset); offset = 0; });
                        return false;
                    });
                } else {
                    this._addFilter(function offsetFilter(cursor, advance, resolve) {
                        return (--offset < 0);
                    });
                }
                return this;
            },

            limit: function (numRows) {
                this._ctx.limit = Math.min(this._ctx.limit, numRows); // For count()
                this._addFilter(function (cursor, advance, resolve) {
                    if (--numRows <= 0) advance(resolve); // Stop after this item has been included
                    return numRows >= 0; // If numRows is already below 0, return false because then 0 was passed to numRows initially. Otherwise we wouldnt come here.
                });
                return this;
            },

            first: function (cb) {
                var self = this;
                fake(function () { cb(getInstanceTemplate(self._ctx.table)); });
                return this.limit(1).toArray(function (a) { return a[0] }).then(cb);
            },

            last: function (cb) {
                return this.desc().first(cb);
            },

            and: function (filterFunction) {
                /// <param name="jsFunctionFilter" type="Function">function(val){return true/false}</param>
                var self = this;
                fake(function () { filterFunction(getInstanceTemplate(self._ctx.table)); });
                this._addFilter(function (cursor) {
                    return filterFunction(cursor.value);
                });
                return this;
            },

            or: function (indexName) {
                return new WhereClause(this._ctx.tf, this._ctx.table, indexName, this.constructor, this);
            },

            desc: function () {
                this._ctx.dir = (this._ctx.dir == "prev" ? "next" : "prev");
                if (this._ondirectionchange) this._ondirectionchange(this._ctx.dir);
                return this;
            },

            eachKey: function (cb) {
                var self = this;
                fake(function () { cb(getInstanceTemplate(self._ctx.table)[self._ctx.index]); });
                this._ctx.op = "openKeyCursor";
                return this.each(function (val, cursor) { cb(cursor.key); });
            },

            eachUniqueKey: function (cb) {
                this._ctx.unique = "unique";
                return this.eachKey(cb);
            },

            keys: function (cb) {
                fake(function () { cb([getInstanceTemplate(ctx.table)[self._ctx.index]]); });
                var self = this,
                    ctx = this._ctx;
                this._ctx.op = "openKeyCursor";
                var a = [];
                return this.each(function (item, cursor) {
                    a.push(cursor.key);
                }).then(function () {
                    return a;
                }).then(cb);
            },

            uniqueKeys: function (cb) {
                this._ctx.unique = "unique";
                return this.keys(cb);
            },

            distinct: function () {
                var set = {};
                this._addFilter(function (cursor) {
                    var strKey = JSON.stringify(cursor.primaryKey);
                    var found = set.hasOwnProperty(strKey);
                    set[strKey] = true;
                    return !found;
                });
                return this;
            }
        });

        function WriteableCollection() {
            Collection.apply(this, arguments);
        }

        derive(WriteableCollection).from(Collection).extend({
            modify: function (changes) {
                var self = this,
                    ctx = this._ctx;

                return this._promise(function (resolve, reject) {
                    if (!ctx.oneshot) ctx.tf.pause(); // If in transaction (not oneshot), make next read operation in same transaction wait to execute until we are node modifying. Caller doenst need to wait for then(). Easier code!
                    var keys = Object.keys(changes);
                    var getters = keys.map(function (key) {
                        var value = changes[key];
                        return (value instanceof Function ? value : function () { return value });
                    });
                    var count = 0;

                    function modifyItem(item, cursor, advance) {
                        ++count;
                        for (var i = 0, l = keys.length; i < l; ++i) {
                            item[keys[i]] = getters[i](item);
                        }
                        var req = cursor.update(item);
                        req.onerror = eventRejectHandler(function (e) {
                            advance(function () { }); // Stop iterating
                            var catched = reject(e);
                            if (catched && ctx.oneshot) ctx.tf.resume();
                            return catched;
                        }, function () { return ["modifying", item, "on", ctx.table]; });
                    }

                    if (ctx.oneshot) {
                        self._iterate(modifyItem, function () { }, reject, RW);
                        ctx.trans.oncomplete = function () { resolve(count); };
                    } else {
                        self._iterate(modifyItem, function () {
                            ctx.tf.resume();
                            resolve(count);
                        }, reject, RW);
                    }
                });
            },
            'delete': function () {
                var self = this,
                    ctx = this._ctx;

                return this._promise(function (resolve, reject) {
                    if (!ctx.oneshot) ctx.tf.pause(); // If in transaction (not oneshot), make next read operation in same transaction wait to execute until we are node modifying. Caller doenst need to wait for then(). Easier code!
                    var count = 0;

                    function deleteItem(item, cursor, advance) {
                        ++count;
                        cursor.delete().onerror = eventRejectHandler(function (e) {
                            advance(function () { }); // Stop iterating
                            var catched = reject(e);
                            if (catched && ctx.oneshot) ctx.tf.resume();
                            return catched;
                        }, function () { return ["deleting", item, "on", ctx.table]; });
                    }

                    if (ctx.oneshot) {
                        self._iterate(deleteItem, function () { }, reject, RW);
                        ctx.trans.oncomplete = function () { resolve(count); };
                    } else {
                        self._iterate(deleteItem, function () {
                            ctx.tf.resume();
                            resolve(count);
                        }, reject, RW);
                    }
                });
            }
        });






        //
        //
        //
        // ------------------------- Help functions ---------------------------
        //
        //
        //

        function lowerVersionFirst(a, b) {
            return a._cfg.version - b._cfg.version;
        }

        function getCurrentTableSchema() {
            return versions.sort(lowerVersionFirst).reduce(function (prev, curr) {
                return (curr._cfg.tableSchema ? curr : prev);
            })._cfg.tableSchema;
        }

        function setApiOnPlace(obj, transactionFactory, tableClass, tableNames, schema) {
            for (var i = 0, l = tableNames.length; i < l; ++i) {
                var tableName = tableNames[i];
                if (!obj[tableName]) {
                    obj[tableName] = new tableClass(tableName, transactionFactory);
                    if (schema) obj[tableName]._instanceTemplate = schema[tableName].instanceTemplate;
                }
            }
        }
        function removeTablesApi(obj) {
            for (var key in obj) {
                if (obj[key] instanceof Table) delete obj[key];
            }
        }

        function fake(fn) {
            var to = setTimeout(fn, 1000);
            clearTimeout(to);
        }

        function getInstanceTemplate(tableName) {
            return database[tableName]._instanceTemplate;
        }

        function iterate(req, filter, fn, resolve, reject, mappedProto) {
            if (!req.onerror) req.onerror = eventRejectHandler(reject, ["calling openCursor() or openKeyCursor() on", self._name]);
            if (mappedProto) {
                var origFn = fn;
                if (use_proto) {
                    fn = function (val, cursor, advance) {
                        if (val) val.__proto__ = mappedProto;
                        origFn(val, cursor, advance);
                    }
                } else {
                    fn = function (val, cursor, advance) {
                        if (val) {
                            var rv = Object.create(mappedProto);
                            for (var m in val) rv[m] = val[m];
                            origFn(rv, cursor);
                        } else origFn(val, cursor, advance);
                    }
                }
            }
            if (filter) {
                req.onsuccess = trycatch(function filter_record (e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        var c = function () { cursor.continue(); };
                        if (filter(cursor, function (advancer) { c = advancer }, resolve, reject)) fn(cursor.value, cursor, function (advancer) { c = advancer });
                        c();
                    } else {
                        resolve();
                    }
                }, reject);
            } else {
                req.onsuccess = trycatch(function filter_record (e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        var c = function () { cursor.continue(); };
                        fn(cursor.value, cursor, function (advancer) { c = advancer });
                        c();
                    } else {
                        resolve();
                    }
                }, reject);
            }
        }

        function parseIndexSyntax(indexes) {
            /// <param name="indexes" type="String"></param>
            /// <returns value="[{name:'',keyPath:'',unique:false,multi:false,auto:false,compound:false}]"></returns>
            var rv = [];
            indexes.split(',').forEach(function (index) {
                if (!index) return;
                var name = index.replace("&", "").replace("++", "").replace("*", "");
                var keyPath = (name.indexOf('[') !== 0 ? name : index.substring(1, index.indexOf(']')).split('+'));

                var idx = {
                    name: name,
                    keyPath: keyPath || null,
                    unique: index.indexOf('&') != -1,
                    multi: index.indexOf('*') != -1,
                    auto: index.indexOf("++") != -1,
                    compound: Array.isArray(keyPath),
                    dotted: keyPath.indexOf('.') != -1
                };
                idx.src = (idx.unique ? '&' : '') + (idx.multi ? '*' : '') + (idx.auto ? "++" : "") + idx.keyPath;
                rv.push(idx);
            });
            return rv;
        }

        function ascending(a, b) {
            return a < b ? -1 : a > b ? 1 : 0;
        }

        function descending(a, b) {
            return a < b ? 1 : a > b ? -1 : 0;
        }

        function TransactionFactory() {
            this.waitingFns = [];
            this.paused = false;
        }

        extend(TransactionFactory.prototype, {
            create: function (tableName, mode) {
                if (!db) throw dbOpenError;
                return db.transaction(tableName, mode || R);
            },
            oneshot: true,
            createPromise: function (fn) {
                return new Promise(fn);
            },
            pause: function () {
                // Temporary set all requests into a pending queue if they are called before database is ready.
                this.paused = true;
                this.createPromise = function (fn) {
                    var proto = this.constructor.prototype;
                    var tf = this;
                    var pausedFn = function (resolve, reject) {
                        var thiz = this, args = arguments;
                        tf.waitingFns.push(function () {
                            try {
                                fn.apply(thiz, args);
                            } catch (e) { reject(e); }
                        });
                    };
                    return proto.createPromise.call(this, pausedFn);
                }
                return this;
            },
            resume: function () {
                this.paused = false;
                delete this.createPromise; // Take back its prototype and original version of createPromise.
                while (this.waitingFns.length > 0 && !this.paused) {
                    var fn = this.waitingFns.shift();
                    try { fn(); } catch (e) { }
                }
                return this;
            }
        });

        function MultireqTransactionFactory(storeNamesOrTrans, mode) {
            TransactionFactory.call(this);
            this.dexieTrans = null;
            this.trans = (storeNamesOrTrans instanceof IDBTransaction ? storeNamesOrTrans : null);
            this.storeNames = this.trans ? null : storeNamesOrTrans;
            this.mode = mode || null;
            this.inactive = false;
        }

        derive(MultireqTransactionFactory).from(TransactionFactory).extend({
            oneshot: false,
            create: function () {
                // Since this is a Multi-request transaction factory, we cache the transaction object once it has been created and continue using it.
                if (this.trans) return this.trans;
                if (!db) throw dbOpenError;
                var self = this;
                this.trans = db.transaction(this.storeNames, this.mode);
                this.trans.onerror = function (e) {
                    self.dexieTrans.on("error").fire(e && e.target.error);
                    e.preventDefault(); // Prohibit default bubbling to window.error
                    self.dexieTrans.abort(); // Make sure transaction is aborted since we preventDefault.
                }
                this.trans.onabort = this.dexieTrans.on("abort").fire;
                this.trans.oncomplete = this.dexieTrans.on("complete").fire;
                this.dexieTrans.on("abort", function () { self.inactive = true; });
                this.dexieTrans.on("complete", function () { self.inactive = true; });
                return this.trans;
            },
            createPromise: function (fn) {
                var self = this;
                var baseClass = TransactionFactory;
                var p = baseClass.prototype.createPromise.call(this, fn);
                p.onuncatched = function (e) {
                    // Bubble to transaction
                    self.dexieTrans.on("error").fire(e);
                    self.dexieTrans.abort();
                }
                return p;
            },
        });

        function FinishableTransactionFactory(storeNamesOrTrans, mode) {
            MultireqTransactionFactory.call(this, storeNamesOrTrans, mode);
            this.uncompleteRequests = 0;
            this.onfinish = null;
        }

        derive(FinishableTransactionFactory).from(MultireqTransactionFactory).extend({
            createPromise: function (fn) {
                /// <summary>
                ///   This overriding of createPromise() will keep count of any pending request on the transaction and be able
                ///   to notify when there are no more pending requests. This is important in the upgrading framework 
                ///   because the underlying implementation of IndexedDB will automatically commit any transaction as soon as there are
                ///   no pending requests left on it. We use this in order to run different version upgraders sequencially on the same transaction without
                ///   requiring the API user to call a callback or return a promise from each upgrader. This makes the upgrader functions more easy
                ///   to implement.
                /// </summary>
                /// <param name="fn"></param>
                var self = this;
                ++self.uncompleteRequests;
                function proxy(fn) {
                    return function () {
                        fn.apply(this, arguments);
                        if (--self.uncompleteRequests == 0 && self.onfinish) self.onfinish();
                    }
                }
                var baseClass = MultireqTransactionFactory;
                return baseClass.prototype.createPromise.call(this, function (resolve, reject) {
                    arguments[0] = proxy(resolve);
                    arguments[1] = proxy(reject);
                    fn.apply(this, arguments);
                });
            }
        });

        function assert(b) {
            if (!b) throw new Error("Assertion failed");
        }

        function asap (fn) {
            if (window.setImmediate) setImmediate(fn); else setTimeout(fn, 0);
        }

        function trycatch(fn, reject) {
            return function () {
                try { fn.apply(this, arguments); } catch (e) { reject(e); };
            };
        }

        function combine(filter1, filter2) {
            return filter1 ? filter2 ? function () { return filter1.apply(this, arguments) && filter2.apply(this, arguments) } : filter1 : filter2;
        }

        function eventToError(fn) {
            return function (e) {
                return fn(e && e.target && e.target.error);
            }
        }

        function getByKeyPath(obj, keyPath) {
            // http://www.w3.org/TR/IndexedDB/#steps-for-extracting-a-key-from-a-value-using-a-key-path
            if (!keyPath) return obj;
            if (Array.isArray(keyPath)) {
                var rv = [];
                for (var i=0,l=keyPath.length;i<l;++i) {
                    var val = getByKeyPath(obj, keyPath[i]);
                    if (val === undefined) return;
                    rv.push(val);
                }
                return val;
            }
            var period = keyPath.indexOf('.');
            if (period != -1) {
                var innerObj = obj[keyPath.substr(0, period)];
                return innerObj === undefined ? undefined : getByKeyPath(innerObj, keyPath.substr(period + 1));
            }
            return obj[keyPath];
        }

        function setByKeyPath(obj, keyPath, value) {
            if (!obj || keyPath === undefined) return;
            if (Array.isArray(keyPath)) {
                assert(Array.isArray(value));
                for (var i = 0, l = keyPath.length; i < l; ++i) {
                    setByKeyPath(obj, keyPath[i], value[i]);
                }
            } else {
                var period = keyPath.indexOf('.');
                if (period !== -1) {
                    var currentKeyPath = keyPath.substr(0, period);
                    var remainingKeyPath = keyPath.substr(period + 1);
                    if (remainingKeyPath === "")
                        obj[currentKeyPath] = value;
                    else {
                        var innerObj = obj[currentKeyPath];
                        if (!innerObj) innerObj = (obj[currentKeyPath] = {});
                        setByKeyPath(innerObj, remainingKeyPath, value);
                    }
                } else {
                    obj[keyPath] = value;
                }
            }
        }

        function eventRejectHandler(reject, sentance) {
            return function (event) {
                var origErrObj = (event && event.target.error) || {};
                var errObj = Object.create(origErrObj);
                errObj.toString = function () {
                    return origErrObj.toString() + " occurred when " + sentance.map(function (word) {
                        return typeof (word) === 'function' ? word() : JSON.stringify(word);
                    }).join(" ");
                };
                var catched = reject(errObj);
                if (catched) {
                    // Rejection was catched. Stop error from propagating to IDBTransaction.
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                }
            };
        }

        function events(ctx, eventNames) {
            var args = arguments;

            var evs = {};
            function add (eventName) {
                function fire (val) {
                    for (var i=this.l.length -1; i>=0; --i) {
                        if (this.l[i](val) === false) return false;
                    }
                }
                evs[eventName] = {
                    l: [],
                    f: fire,
                    s: function(cb) { this.l.push(cb);},
                    u: function(cb) {
                        this.l = this.l.filter(function(fn){ return fn !== cb; });
                    }
                }
                return fire;
            }

            function promise(success, fail) {
                var res = add(success);
                var rej = add(fail);
                var promise = new Promise(function (resolve, reject) {
                    evs[success].f = resolve;
                    evs[fail].f = reject;
                });
                evs[success].p = promise;
                promise.then(function (val) {
                    res.call(evs[success], val);
                }, function (val) {
                    rej.call(evs[fail], val);
                });
            }

            for (var i = 1, l = args.length; i < l; ++i) {
                var eventName = args[i];
                if (typeof (eventName) == 'string') {
                    // non-promise event
                    add(eventName);
                } else {
                    // promise-based event pair (i.e. we promise to call one and only one of the events in the pair, and to only call it once (unless reset() is called))
                    promise(eventName[0], eventName[1]);
                }
            }
            var rv = function (eventName, subscriber) {
                if (subscriber) {
                    // Subscribe
                    evs[eventName].s(subscriber);
                    return ctx;
                } else if (typeof (eventName) === 'string') {
                    // Return interface allowing to fire or unsubscribe from event
                    return {
                        fire: function (val) {
                            evs[eventName].f(val);
                        },
                        unsubscribe: function (fn) {
                            evs[eventName].u(fn);
                        },
                    };
                } else {
                    // Return interface allowing access to backend Promise and resetting.
                    var success = eventName[0], fail = eventName[1];
                    return {
                        getPromise: function () {return evs[success].p;},
                        //reset: function () { promise(success, fail);} Reset not used anymore
                    };
                }
            }
            return rv;
        }

        function hasIEDeleteObjectStoreBug() {
            // Assume bug is present in IE10 and IE11 but dont expect it in next version of IE (IE12)
            return navigator.userAgent.indexOf("Trident / 7.0; rv: 11.0") >= 0 || navigator.userAgent.indexOf("MSIE") >= 0;
        }

        this._types = {
            Collection: Collection,
            Promise: Promise,
            Table: Table,
            Transaction: Transaction,
            Version: Version,
            WhereClause: WhereClause,
            WriteableCollection: WriteableCollection,
            WriteableTable: WriteableTable,
            WriteableTransaction: WriteableTransaction,
        };

        init();
    }

    //
    // A variant of promise-light (https://github.com/taylorhakes/promise-light) by https://github.com/taylorhakes - an A+ and ECMASCRIPT 6 compliant Promise implementation.
    //
    // Modified by David Fahlander to be indexedDB compliant (See discussion: https://github.com/promises-aplus/promises-spec/issues/45) .
    // This implementation will not use setTimeout or setImmediate when it's not needed. The behavior is 100% Promise/A+ compliant since
    // the caller of new Promise() can be certain that the promise wont be triggered the lines after constructing the promise. We fix this by using the member variable constructing to check
    // whether the object is being constructed when reject or resolve is called. If so, the use setTimeout/setImmediate to fulfill the promise, otherwise, we know that it's not needed.
    //
    // This topic was also discussed in the following thread: https://github.com/promises-aplus/promises-spec/issues/45 and this implementation solves that issue.
    //
    // Another feature with this Promise implementation is that reject will return false in case no one catched the reject call. This is used
    // to stopPropagation() on the IDBRequest error event in case it was catched but not otherwise.
    //
    // Also, the event new Promise().onuncatched is called in case no one catches a reject call. This is used for us to manually bubble any request
    // errors to the transaction. We must not rely on IndexedDB implementation to do this, because it only does so when the source of the rejection
    // is an error event on a request, not in case an ordinary exception is thrown.
    var Promise = (function () {

        // The use of asap in handle() is remarked because we must NOT use setTimeout(fn,0) because it causes premature commit of indexedDB transactions - which is according to indexedDB specification.
        var asap = typeof (setImmediate) === 'undefined' ? function (fn, arg1, arg2, argN) {
            var args = arguments;
            setTimeout(function () { fn.apply(this, [].slice.call(args, 1)) }, 0);// If not FF13 and earlier failed, we could use this call here instead: setTimeout.call(this, [fn, 0].concat(arguments));
        } : function (fn, arg1, arg2, argN) {
            setImmediate.apply(this, arguments); // IE10+ and node.
        };

        function Promise(fn) {
            if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
            if (typeof fn !== 'function') throw new TypeError('not a function');
            this._state = null; // null (=pending), false (=rejected) or true (=resolved)
            this._value = null; // error or result
            this._deferreds = [];
            this._catched = false; // for onuncatched
            var self = this;
            var constructing = true;

            try {
                doResolve(fn, function (data) {
                    if (constructing)
                        asap(resolve, self, data);
                    else
                        resolve(self, data);
                }, function (reason) {
                    if (constructing) {
                        asap(reject, self, reason);
                        return false;
                    } else {
                        return reject(self, reason);
                    }
                });
            } finally {
                constructing = false;
            }
        }

        function handle(deferred) {
            var self = this;
            if (this._state === null) {
                this._deferreds.push(deferred);
                return;
            }

            var cb = self._state ? deferred.onFulfilled : deferred.onRejected;
            if (cb === null) {
                // This Deferred doesnt have a listener for the event being triggered (onFulfilled or onReject) so lets forward the event to any eventual listeners on the Promise instance returned by then() or catch()
                (self._state ? deferred.resolve : deferred.reject)(self._value);
                return;
            }
            var ret;
            try {
                ret = cb(self._value);
                if (!self._state) setCatched(self);
            } catch (e) {
                var catched = deferred.reject(e);
                if (!catched && self.onuncatched) {
                    try { self.onuncatched(e); } catch (e) { }
                }
                return;
            }
            deferred.resolve(ret);
        }

        function setCatched(promise) {
            promise._catched = true;
            if (promise._parent) setCatched(promise._parent);
        }

        function resolve(promise, newValue) {
            try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
                if (newValue === promise) throw new TypeError('A promise cannot be resolved with itself.');
                if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
                    if (typeof newValue.then === 'function') {
                        doResolve(function (resolve, reject) {
                            newValue.then(resolve, reject);
                        }, function (data) {
                            resolve(promise, data);
                        }, function (reason) {
                            reject(promise, reason);
                        });
                        return;
                    }
                }
                promise._state = true;
                promise._value = newValue;
                finale.call(promise);
            } catch (e) { reject(e) }
        }

        function reject(promise, newValue) {
            promise._state = false;
            promise._value = newValue;

            finale.call(promise);
            if (!promise._catched && promise.onuncatched) {
                try { promise.onuncatched(promise._value); } catch (e) { }
            }
            return promise._catched;
        }

        function finale() {
            for (var i = 0, len = this._deferreds.length; i < len; i++) {
                handle.call(this, this._deferreds[i]);
            }
            this._deferreds = null; // ok because _deferreds can impossibly be accessed anymore (reject or resolve will never be called again, and handle() will not touch it since _state !== null.
        }

        function Deferred (onFulfilled, onRejected, resolve, reject) {
            this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
            this.onRejected = typeof onRejected === 'function' ? onRejected : null;
            this.resolve = resolve;
            this.reject = reject;
        }

        /**
         * Take a potentially misbehaving resolver function and make sure
         * onFulfilled and onRejected are only called once.
         *
         * Makes no guarantees about asynchrony.
         */
        function doResolve(fn, onFulfilled, onRejected) {
            var done = false;
            try {
                fn(function Promise_resolve (value) {
                    if (done) return;
                    done = true;
                    onFulfilled(value);
                }, function Promise_reject (reason) {
                    if (done) return;
                    done = true;
                    return onRejected(reason);
                })
            } catch (ex) {
                if (done) return;
                return onRejected(ex);
            }
        }

        Promise.all = function () {
            var args = Array.prototype.slice.call(arguments.length === 1 && Array.isArray(arguments[0]) ? arguments[0] : arguments);

            return new Promise(function (resolve, reject) {
                if (args.length === 0) return resolve([]);
                var remaining = args.length;
                function res(i, val) {
                    try {
                        if (val && (typeof val === 'object' || typeof val === 'function')) {
                            var then = val.then;
                            if (typeof then === 'function') {
                                then.call(val, function (val) { res(i, val) }, reject);
                                return;
                            }
                        }
                        args[i] = val;
                        if (--remaining === 0) {
                            resolve(args);
                        }
                    } catch (ex) {
                        reject(ex);
                    }
                }
                for (var i = 0; i < args.length; i++) {
                    res(i, args[i]);
                }
            });
        };

        /* Prototype Methods */
        Promise.prototype.then = function (onFulfilled, onRejected) {
            var self = this;
            var p = new Promise(function (resolve, reject) {
                handle.call(self, new Deferred(onFulfilled, onRejected, resolve, reject));
            });
            p._parent = this; // Used for recursively calling onuncatched event on self and all parents.
            return p;
        };

        Promise.prototype['catch'] = function (onRejected) {
            if (arguments.length === 1) return this.then(null, onRejected);
            // First argument is the Error type to catch
            var type = arguments[0], callback = arguments[1];
            return this.then(null, function (e) {
                if (e instanceof type) return callback(e); else throw e;
            });
        };

        Promise.prototype['finally'] = function (onFinally) {
            return this.then(onFinally, onFinally);
        };

        Promise.prototype.onuncatched = null; // Optional event triggered if promise is rejected but no one listened.

        Promise.resolve = function (value) {
            return new Promise(function (resolve) {
                resolve(value);
            });
        };

        Promise.reject = function (value) {
            return new Promise(function (resolve, reject) {
                reject(value);
            });
        };

        Promise.race = function (values) {
            return new Promise(function (resolve, reject) {
                values.map(function (value) {
                    value.then(resolve, reject);
                })
            });
        };

        return Promise;
    })();


    Dexie.delete = function (databaseName) {
        var db = new Dexie(databaseName),
            promise = db.delete();
        promise.onblocked = function (fn) {
            db.on("blocked", fn);
            return this;
        };
        return promise;
    }

    // Define the very-base classes of the framework, in case any 3rd part library wants to extend the prototype of these classes
    Dexie.Collection = function () { };
    Dexie.Table = function () { };
    Dexie.Transaction = function () { };
    Dexie.WhereClause = function () { };

    //
    // Dependencies
    //
    // These will automatically work in browsers with indexedDB support, or where an indexedDB polyfill has been included.
    //
    // In node.js, however, these properties must be set "manually" before instansiating a new Dexie(). For node.js, you need to require indexeddb-js or similar and then set these deps.
    //
    Dexie.dependencies = {
        // Required:
        indexedDB: window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
        IDBKeyRange: window.IDBKeyRange || window.webkitIDBKeyRange,
        IDBTransaction: window.IDBTransaction || window.webkitIDBTransaction,
        // Optional:
        Promise: window.Promise, // If not present, it is polyfilled by PromiseLight in this JS-file.
        Error: window.Error || String,
        TypeError: window.TypeError || String,
        RangeError: window.RangeError || String,
        DOMError: window.DOMError || String
    }

    // API Version Number: Type Number, make sure to always set a version number that can be comparable correctly. Example: 0.9, 0.91, 0.92, 1.0, 1.01, 1.1, 1.2, 1.21, etc.
    Dexie.version = 0.93;

    // Publish the Dexie to browser or NodeJS environment.
    publish("Dexie", Dexie);

}).apply(this, typeof module === 'undefined' || (typeof window !== 'undefined' && this == window) 
    ? [window, function (name, value) { window[name] = value; }, true ]    // Adapt to browser environment
    : [global, function (name, value) { module.exports = value; }, false]); // Adapt to Node.js environment

