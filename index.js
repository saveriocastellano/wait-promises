
const {EventEmitter} = require('events');
const {Session} = require('inspector');


module.exports = new class extends EventEmitter {

    wait() {
        process.once('beforeExit', this._start.bind(this));
    }

    _start() {
        let self = this;
        this._session = new Session();
        this._session.connect();

        this._heartBeatTimer = setInterval(()=>self.emit('heartbeat'), 100); 
       
        this._session.post('Runtime.evaluate', {expression: 'Promise.prototype'}, this._gotPromisePrototype.bind(this));      
    }

    _heartBeat() {
        this._exit();
        if (Number.isInteger(this._maxSeconds) && this._maxSeconds != -1 && (Date.now() - this._startedAt) > this._maxSeconds) {
            this.emit('timeout');
            this._exit();
            return;
        }
        this.emit('heartbeat');
    }

    _gotPromisePrototype(err, params) {
        if (err) return this._exit(err);
        this._objectId = params.result.objectId;
        this._session.post('Runtime.queryObjects', {prototypeObjectId: this._objectId}, this._getPromises.bind(this));
    }

    _releaseObjectAndContinue(nextCallback) {
        let self = this;
        this._session.post('Runtime.releaseObject', {objectId: this._objectId}, (err)=>{
            if (err) return self._exit(err);
            nextCallback.call(self);
        });        
    }
        
    _getPromises(err, params) {
        this._releaseObjectAndContinue(()=>{
            if (err) return this._exit(err);
            this._objectId = params.objects.objectId;
            this._session.post('Runtime.getProperties', {objectId: this._objectId, ownProperties: true}, this._startLoop.bind(this));
        })
    }

    _startLoop(err, params) {
        this._releaseObjectAndContinue(()=>{
            if (err) return this._exit(err);
            this._promises = params.result.filter(prop=>!isNaN(parseInt(prop.name))).map(prop=>prop.value.objectId);
            this._count = 0;
            this._loop();
        })        
    }

    _loop() {
        if (this._promises.length == 0) return this._exit();
        this._objectId = this._promises.splice(0, 1)[0];
        this._session.post('Runtime.getProperties', {objectId: this._objectId, ownProperties: true}, this._waitForPromise.bind(this));
    }

    _waitForPromise(err, params) {
        if (err) return this._exit(err);
        let status = params.internalProperties.find(prop=>prop.name=='[[PromiseState]]').value;
        if (status.value != 'pending') {
            this._releaseObjectAndContinue(()=>{
                this._loop();
            });
            return;
        }
        this._count ++;
        this.emit('await', this._promises.length+1);        
        this._session.post('Runtime.awaitPromise', {promiseObjectId: this._objectId}, this._awaitResult.bind(this));
    }

    _awaitResult(err) {
        this._releaseObjectAndContinue(()=>{
            if (err) return this._exit(err);
            this._loop();    
        });
    }

    _exit(err) {
        clearInterval(this._heartBeatTimer);
        this._session.disconnect();
        if (err) {
            this.emit('error', err);
        } else {
            this.emit('done', this._count);
        }
    }
}

