var NOSCmata = require('./lib/noscmata').NOSCmata;

var oscConfig = {
    inHost: "localhost"
    ,outHost: "localhost"
    ,inPort: 7000
    ,outPort: 7001
    ,senderId: "defaultSender"
  };
  var config = {};
  config.osc = oscConfig;
  config.serialPort = "COM4";
  var noscmata = new NOSCmata(config);