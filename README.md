# nfork
extensible clustering module based on node.js' cluster. 
*nfork* provides a clean interface to apply node.js' cluster module and broadcast messages between forks.
 
**I've implemented needed parts only which required for my own case. 
It might get better features in future if I need more but can't promise anything.
On the other hand, you are free to apply anything you want.**

## install

$ npm install nfork

## usage

```javascript

var inherits = require('util').inherits;
var nfork = require('nfork'); // after installing via npm

function Test() {
    nfork.Cluster.call(this);
}
inherits(Test, nfork.Cluster);

Test.prototype.run = function () {
    if (nfork.is('master')) {
        this.__master(); // main process
    } else {
        // child processes
    }
};

```
