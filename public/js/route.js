var map;
window.onload = function() {
  map = new init();
}
function init() {
  var that = this;

  var SCREEN_WIDTH = 800; //window.innerWidth;
  var SCREEN_HEIGHT = 600; //window.innerHeight;
  var HALF_WIDTH = SCREEN_WIDTH/2;
  var HALF_HEIGHT = SCREEN_HEIGHT/2;

  // canvas element and 2D context
  var canvas = document.createElement('canvas');
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;
  document.body.appendChild(canvas);
  var context = canvas.getContext('2d');

  context.fillStyle="rgb(0,0,0)";
  context.fillRect(0,0, SCREEN_WIDTH, SCREEN_HEIGHT);

  function drawRoute(route) {
    var c = context;
    c.lineWidth= 2; 
    c.strokeStyle = "rgb(255,255,255)";   
    c.beginPath();
    c.moveTo(route[0][0],route[0][1]); 
    for(var i=1; i < route.length; i++) {
      c.lineTo(route[i][0],route[i][1]); 
    }
    c.stroke();  
  }

  var r=[[HALF_WIDTH,HALF_HEIGHT]];
  for(var i=0; i < 1000; i++) {
    var last = r[r.length-1];
    r.push([last[0]+rand_range(-2, 2), last[1]+rand_range(-2, 2)]);
  }
  drawRoute(r);
}

function rand_range(max, min) {
  return Math.random()*(min-max) + max
}
