const Fork = require('child_process').fork;
const Path = require('path');
const Net = require('net');
const isPortOpen = function (port) {
    return new Promise((resolve, reject) => {
        let s = Net.createServer();
        s.once('error', (err) => {
            s.close();
            if (err["code"] == "EADDRINUSE") {
                resolve(true);
            } else {
                resolve(false);
            }
        });
        s.once('listening', () => {
            resolve(false);
            s.close();
        });
        s.listen(port);
    });
}

const Server = function() {
    var self = this;
    self.instance = null;
    self.$event = {};
    self.inuse = false;

    self.listen = async function() {
        self.inuse = await isPortOpen(8500);
        if (self.inuse) {
            self.exec('eaddrinuse');
        }else {
            const Child = Fork(Path.join(__dirname, 'index.js'));
            Child.on('message', function(message) {
                console.log('Message', message);
                switch(message) {
                    case 'total:ready':
                        self.instance = Child;
                        self.inuse = true;
                        self.exec('ready');
                        break;
                    case 'total:stop':
                        self.instance = null;
                        self.inuse = false;
                        self.exec('stop');
                        break;
                }   
            });
        }
    };

    
    self.on = function(type, fn) {
        if (self.$event[type])
            self.$event[type].push(fn);
        else
            self.$event[type] = [fn];
    };
    
    self.exec = function(type, callback) {
        if (self.$event[type]) {
            for (var fn of self.$event[type]) {
                if (fn instanceof Function) 
                    fn.call(self);
            }
        }
        
        callback && callback(type);
    }

    self.close = function(callback) {
        if (self.instance) {
            self.instance.kill();
            self.instance = null;
            self.inuse = false;
        }
    }
};
const Host = '0.0.0.0';
const  Port = 8500;
module.exports = { Host, Port, Server: new Server() };