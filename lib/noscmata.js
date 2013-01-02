var osc = require('omgosc');
var firmata = require('firmata');

var DEBUG = true;

var NOSCmata = function(config){
  var self = this;
  self.config = config;
  self.analogActivePins = [];
  
  self.sendMessage = function(path,typetag,params){
    for(client in self.osc.clients){
      self.osc.clients[client].send(path,typetag,params);
    };
       
    
  }
  self.oscMessageReceived = function(message){
    if(DEBUG){
      console.log('Message received');
      console.log(message);
    }
    
  }
  self.callbackDigitalRead = function(data){
    self.sendMessage("/noscmata/digitalread","ii",[data.pin,data.value]);
  }
  self.callbackAnalogRead = function(data){
    for(activePin in self.analogActivePins){
      if(self.analogActivePins[activePin] == data.pin){
        self.sendMessage("/noscmata/analogread","ii",[data.pin,data.value]);
      }
    }
    
  }
  self.messages = {};
  self.messages.connect = function(message){
    var id = message.params[0];
    var host = message.params[1];
    var port = message.params[2];
    self.osc.clients[id] = new osc.UdpSender(host,port);
    self.osc.clients[id].send("/noscmata/connect",'i',[1]);
    if(DEBUG){
      console.log("client added");
    }
  }
  self.messages.pinMode = function(message){
    if(DEBUG){
      console.log('pinMode received');
      console.log(message);
    }
    var pin = message.params[0];
    var mode = message.params[1];
    switch(mode){
      case "input":
        mode = self.board.MODES.INPUT;
        break;
      case "output":
        mode = self.board.MODES.OUTPUT;
        break;
      case "analog":
        mode = self.board.MODES.INPUT;
        break;
      case "pwm":
        mode = self.board.MODES.PWM;
        break;
      case "servo":
        mode = self.board.MODES.SERVO;
        break;
      case "input-pullup":
        mode = self.board.MODES.INPUT;
        var pullup = true;
        break;
    }
    self.board.pinMode(pin,mode);
    if(pullup){
      self.board.digitalWrite(pin,1);
    }
  }
  self.messages.digitalWrite = function(message){
    
    var pin = message.params[0];
    var value = message.params[1];
    self.board.digitalWrite(pin,value);
  }
  /*self.messages.digitalRead = function(message){
    if(DEBUG){
      console.log('digitalRead received');
    }
    var pin = message.params[0];
    var value = self.board.pins[pin].value;
    var lock = message.params[1];
    if(lock == 1){
      if(DEBUG){
        console.log("digitalread locked on pin: " + pin);
      }
    }
    self.sendMessage("/noscmata/digitalread","i",[value]);
  }*/
  self.messages.analogRead = function(message){
    if(DEBUG){
      console.log('analogRead received');
    }
    var pin = message.params[0];
    self.analogActivePins.push(pin);
  }
  self.messages.analogWrite = function(message){
    var pin = message.params[0];
    var value = message.params[1];
    self.board.analogWrite(pin,value);
  } 
  self._prepareBoard(self.config.serialPort);
  
  self._prepareOSC(self.config.osc);
  
  return self;
}

NOSCmata.prototype._prepareOSC = function(config){
  var self = this;
  self.osc = {};
  self.osc.clients = [];
  self.osc.clients[config.senderId] = new osc.UdpSender(config.outHost,config.outPort);
  self.osc.receiver = new osc.UdpReceiver(config.inPort,config.inHost);
  
  self.osc.receiver.on('//noscmata//connect',self.messages.connect);
  self.osc.receiver.on('//noscmata//pinmode',self.messages.pinMode);
  
  self.osc.receiver.on('//noscmata//digitalwrite',self.messages.digitalWrite);
  //self.osc.receiver.on('//noscmata//digitalread',self.messages.digitalRead);
  self.osc.receiver.on('//noscmata//analogread',self.messages.analogRead);
  self.osc.receiver.on('//noscmata//analogwrite',self.messages.digitalWrite);
  //self.osc.receiver.on('',self.oscMessageReceived);
  
  if(DEBUG){
      console.log('OSC OK');
  }
}
NOSCmata.prototype._prepareBoard = function(port){
  var self = this;
  self.board = new firmata.Board(port, function(err) {
    if (err) {
    	console.log(err);
    	return; 
    }
    if(DEBUG){
      console.log('connected');
    } 
    self.board.on("digital-read",self.callbackDigitalRead);
    self.board.on("analog-read",self.callbackAnalogRead);
  });
}
module.exports = {
    NOSCmata: NOSCmata
};
