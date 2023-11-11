
const {EventEmitter} = require('events');
const {Session} = require('inspector');

module.exports = new class extends EventEmitter {

    run() {
        this._session = new Session();
        this._session.connect();
        this._count = 0;
        this._getPromises();
    }
        
    _getPromises() {
        this._session.post('Runtime.evaluate', {expression: 'Promise.prototype'}, this._gotPromisePrototype.bind(this));      
    }

    _gotPromisePrototype(err, params) {
        if (err) return this._done(err);
        this._objectId = params.result.objectId;
        this._session.post('Runtime.queryObjects', {prototypeObjectId: this._objectId}, this._gotPromiseObjects.bind(this));
    }

    _releaseObjectAndContinue(nextCallback) {
        let self = this;
        this._session.post('Runtime.releaseObject', {objectId: this._objectId}, (err)=>{
            if (err) return self._done(err);
            nextCallback.call(self);
        });        
    }
        
    _gotPromiseObjects(err, params) {
        this._releaseObjectAndContinue(()=>{
            if (err) return this._done(err);
            this._objectId = params.objects.objectId;
            this._session.post('Runtime.getProperties', {objectId: this._objectId, ownProperties: true}, this._gotPromises.bind(this));
        })
    }

    _gotPromises(err, params) {

        this._releaseObjectAndContinue(()=>{
            if (err) return this._done(err);
            this._promises = params.result.filter(prop=>Number.isInteger(parseInt(prop.name))).map(prop=>prop.value.objectId);
            this._anyPending = false;
            this._getNextPromise();
        })        
    }

    _getNextPromise() {
        if (this._promises.length == 0) {
            if (this._anyPending) {
                return process.nextTick(this._getPromises.bind(this));
            } else {
                return this._done();
            }
        }
        this._objectId = this._promises.shift();
        this._session.post('Runtime.getProperties', {objectId: this._objectId, ownProperties: true}, this._waitForPromise.bind(this));
    }

    _waitForPromise(err, params) {
        if (err) return this._done(err);
        let status = params.internalProperties.find(prop=>prop.name=='[[PromiseState]]').value;
        if (status.value != 'pending') {
            this._releaseObjectAndContinue(()=>{
                this._getNextPromise();
            });
            return;
        }
        this._count ++;
        this._anyPending = true;
        this.emit('await', this._count);        
        this._session.post('Runtime.awaitPromise', {promiseObjectId: this._objectId}, this._awaitResult.bind(this));
    }

    _awaitResult(err) {
        this._releaseObjectAndContinue(()=>{
            if (err) return this._done(err);
            this._getNextPromise();    
        });  
    }

    _done(err) {
        this._session.disconnect();
        if (err) {
            this.emit('error', err);
        } else {
            this.emit('done', this._count);
        }
    }
}
