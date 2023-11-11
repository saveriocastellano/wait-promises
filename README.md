# wait-promises
allows you to wait for all pending promises to complete before the NodeJS process exits 

# installation

npm install wait-promises

# usage

```

process.once('beforeExit', () => {
    new Promise(resolve => setTimeout(() => resolve(), 500));
    new Promise(resolve => setTimeout(() => resolve(), 2500));
    new Promise(resolve => setTimeout(() => resolve(), 2500));
});
  
let waiter = require('wait-promises');
waiter.wait();

waiter.on('heartbeat', () => console.log('tick'));
waiter.on('await', num => console.log(`waiting for ${num} promises`));
waiter.on('done', num => console.log(`waited for ${num} promises`));

```
