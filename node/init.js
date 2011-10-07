var hello = require('./hello');
var bool = false;
var count = 0;
var intervalID;

function change_bool() {
  if(Math.random() > 0.5) {
    bool = true;
  } else {
    bool = false;
  }
}
for(var i=0; i<25; i++) {
  if(Math.random() < 0.1) {
    hello.world("unlikely");
  }
}
