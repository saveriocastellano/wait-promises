# wait-promises
allows you to wait for all pending promises to complete before the NodeJS process exits.
This module can be used to implement graceful exiting of the NodeJS process or graceful termination of workers.

Graceful exiting can be implemented by terminating processes with SIGINT signal, this enable wait-promises to 
wait for the completion of pending promises. 

Follow the following steps:

- listen to SIGINT and in the handler call run() method to check and wait for pending promises
- listen to the 'done' event to know when all pending promises have completed and then call process.exit()

wait-promises not only waits for all promises that are pending when SIGINT signal is received, it also waits for
any other promise originating from them (see example below).

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

Executing the above test without sending SIGINT signal to the process (Control-c) gives the following output: 

```
sleeping 3000ms...
slept!
sleeping 3000ms...
slept!
all sleeps completed!
```
Executing the above test and immediately pressing Control-c to send SIGINT signal the the process gives the following output:

```
sleeping 3000ms...
^Cwaiting for promise #1 
slept!
sleeping 3000ms...
waiting for promise #2 
slept!
all sleeps completed!
waited for 2 promises
```

#donate!
Is this project useful to you? If this is the case and if you really can't resist of sending me money
you can use this [page](https://saveriocastellano.github.io/wait-promises/) to make a crypto donation to me, rest assured I will do something useful with it.




