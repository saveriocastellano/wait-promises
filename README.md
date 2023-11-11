# wait-promises
allows you to wait for all pending promises to complete before the NodeJS process exits.
This module can be used to implement graceful exiting of the NodeJS process or graceful termination of workers.

Graceful exiting can be implemented by terminating processes with SIGINT signal, this enable wait-promises to 
wait for the completion of pending promises. 

Follow the following steps:

- listen to SIGINT and in the handler call run() method to check and wait for pending promises
- listen to the 'done' event to know when all pending promises have completed and then call process.exit()

# installation

npm install wait-promises

# usage

```

const Waiter = require('wait-promises');

const sleep = ms => new Promise(res=>{
  console.log(`sleeping ${ms}ms...`)
  setTimeout(() => {
    console.log('slept!'); 
    res()
  }, ms);
});

(async () => {

  sleep(3000).then(()=>{
    sleep(3000).then(()=>{
      console.log("all sleeps completed!")
    });
  });

}) ();


process.on('SIGINT', ()=>Waiter.run());
Waiter.on('await', num => console.log(`waiting for promise #${num} `));
Waiter.on('done', (num) => {console.log(`waited for ${num} promises`); process.exit()});
 

```
