var $cluster = require('cluster');
var EventEmitter = require('events').EventEmitter;
var extend = require('util')._extend;
var shortid = require('shortid');
var inherits = require('util').inherits;

/**
 * @module nFork
 * @class Cluster
 */
function Cluster() {
    EventEmitter.call(this);
    this.options = {
        fork: require('os').cpus().length,
        forkLimit: require('os').cpus().length,
        keepGoing: false,
        retryLimit: 10,
        params: process.argv.slice(2),
        debug: false
    };
    this.forks = {};
}

inherits(Cluster, EventEmitter);

/**
 * This method updates settings
 * @param {Object} options settings
 * @memberof Cluster
 * @method setup
 */
Cluster.prototype.setup = function (options) {
    if (options instanceof Object) {
        this.options = extend(this.options, options);
    }
};

/**
 * This method sets clustering to be enabled forever
 * @memberof Cluster
 * @method forever
 */
Cluster.prototype.forever = function () {
    this.options.keepGoing = true;
};

/**
 * This method sets debugging
 * @memberof Cluster
 * @method debugOn
 */
Cluster.prototype.debug = function () {
    this.options.debug = true;
};

/**
 * This method finds existing fork and returns #ID.
 * @param {Object} worker an instance of Cluster.Worker
 * @returns String
 * @memberof Cluster
 * @method __findByFork
 * @private true
 */
Cluster.prototype.__findByFork = function (worker) {
    var fid = null;
    var self = this;
    Object.keys(this.forks).forEach(function (key) {
        if (worker.process.pid === self.forks[key].worker.process.pid) {
            fid = key;
        }
    });
    return fid;
};

/**
 * This method creates a new fork
 * @param {String} [fid] fork id
 * @throws retry-limit-reached
 * @memberof Cluster
 * @method __fork
 * @private true
 */
Cluster.prototype.__fork = function (fid) {
    var bind = false;
    if (typeof fid != 'string') {
        fid = shortid();
    }
    if (Object.keys(this.forks).length <= this.options.fork) {
        if (!this.forks.hasOwnProperty(fid)) {
            this.forks[fid] = {
                worker: $cluster.fork(),
                started: Date.now(),
                retry: 0
            };
            bind = true;
        } else {
            if (this.forks[fid].worker) {
                this.forks[fid].worker.removeAllListeners('message');
                this.forks[fid].worker.destroy();
            }
            if (this.options.keepGoing || this.forks[fid].retry <= this.options.retryLimit) {
                if (this.options.retryLimit) {
                    this.forks[fid].retry += 1;
                }
                this.forks[fid].worker = $cluster.fork();
                bind = true;
            } else {
                this.forks[fid].worker.removeAllListeners('message');
                delete this.forks[fid];
                this.emit.apply(this, ['error', new Error('E_RETRY_LIMIT_REACHED')]);
            }
        }
        if (bind) {
            var self = this;
            this.forks[fid].worker.removeAllListeners('message');
            if (this.options.debug) {
                this.forks[fid].worker.on('message', function (request) {
                    self.emit.apply(this, ['worker', request]);
                });
            }
        }
    }
};

/**
 * This method is master process handler of cluster implementation
 * @memberof Cluster
 * @method __master
 */
Cluster.prototype.__master = function () {
    var self = this;
    if (this.options.params instanceof Array) {
        $cluster.settings.args = this.options.params;
    }
    $cluster.settings.silent = !this.options.debug;
    $cluster.on('exit', function (worker) {
        var fid = self.__findByFork(worker);
        if (self.forks.hasOwnProperty(fid)) {
            self.__fork(fid);
        }
    });
    for (var i = 0; i < this.options.fork; i++) {
        this.__fork();
    }
};

module.exports = Cluster;