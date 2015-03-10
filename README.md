# nfork
extensible clustering module based on node.js' cluster

## install

$ npm install nfork

## usage

```javascript

var cluster = require('cluster');
var nfork = require('nfork'); // after installing via npm
var inherits = require('util').inherits;

function Test() {
    nfork.call(this);
}
inherits(Test, nfork);

Test.prototype.run = function () {
    if (cluster.isMaster) {
        this.__master(); // main process
    } else {
        // child processes
    }
};

```
