# wait-promises
allows you to wait for all pending promises to complete before the NodeJS process exits 


```
process.once('beforeExit', () => {
    new Promise(resolve => setTimeout(() => resolve(1), 1e3));
    new Promise(resolve => setTimeout(() => resolve(2), 1.5e3));
  });
  
  {
    let waiter = require('./index');
    waiter.wait();

    waiter.on('heartbeat', () => console.log('tick'));
    waiter.on('await', num => console.log(`waiting for ${num} promises`));
    waiter.on('done', num => console.log(`waited for ${num} promises`));
  }

```
