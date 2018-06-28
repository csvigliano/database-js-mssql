var mssql = require('mssql');

/**
 * Database-js driver for MS SQL Server
 *
 * @author  Thiago Delgado Pinto
 *
 * @see     https://github.com/mlaanderson/database-js
 * @see     https://github.com/tediousjs/node-mssql
 * @see     https://github.com/tediousjs/tedious
 */
class MsSql {

    constructor(pool, params) {
        this.pool = pool;
        this.params = params;
        this.transaction = null;
        this._inTransaction = false;
    }

    /**
     * Performs a query or data manipulation command.
     *
     * @param {string} sql
     */
    query(sql) {
        var request = new mssql.Request(this.pool);
        return request.query(sql);
    }

    /**
     * Executes a data manipulation command.
     *
     * @param {string} sql
     */
    execute(sql) {
        return this.query(sql);
    }

    close() {
        var self = this;
        return new Promise( function closePromise(resolve, reject) {
            try {
                self.pool.close();
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    isTransactionSupported() {
        return true;
    }

    inTransaction() {
        return this._inTransaction;
    }

    beginTransaction() {
        if (true === this.inTransaction()) {
            return Promise.resolve(false);
        }
        this.transaction = new mssql.Transaction(this.pool);
        this._inTransaction = true;
        return this.transaction.begin();
    }

    commit() {
        if (false === this.inTransaction()) {
            return Promise.resolve(false);
        }
        this._inTransaction = false;
        return this.transaction.commit();
    }

    rollback() {
        if (false === this.inTransaction()) {
            return Promise.resolve(false);
        }
        this._inTransaction = false;
        return this.transaction.rollback();
    }
}

module.exports = {
    open: function(connection) {

        try { // avoid warnings
            (async function openAsync(connection) {

                if ('string' === typeof connection) {
                    return new MsSql(await mssql.connect(connection));
                }

                var convertedConnection = {
                    server: connection.Hostname || 'localhost',
                    port: parseInt(connection.Port) || 1433,
                    database: connection.Database,
                    user: connection.Username,
                    password: connection.Password,
                    options: connection.options || {}
                };

                var config = Object.assign(
                    {
                        options: {
                            abortTransactionOnError: true,
                            encrypt: false
                        }
                    },
                    convertedConnection
                );

                return new MsSql(await mssql.connect(config));
            })(connection);

        } catch ( err ) {
            throw err; // rethrow
        }
    }
};