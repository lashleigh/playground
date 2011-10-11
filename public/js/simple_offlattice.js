var balls = [];
var canvas;
var RADIUS = 300;
var PARTICLE_RADIUS = 3;
var STEP_SIZE = PARTICLE_RADIUS/4;
var DIAMETE_SQUARED = 4*PARTICLE_RADIUS*PARTICLE_RADIUS;
var free_ball;
var drop_radius = 25;
var max_dist = 0;
var CANVAS_WIDTH = 2*RADIUS;
var CANVAS_HEIGHT = 2*RADIUS;
var idle = true;
var FPS = 60;
var start_time;
var TIME = Math.floor(Math.random()*1500);

$(function() {
  var canvasElement = $("<canvas width='" + CANVAS_WIDTH + 
                        "' height='" + CANVAS_HEIGHT + "'></canvas>");
  canvas = canvasElement.get(0).getContext("2d");
  canvas.fillStyle = '#fff';
  canvas.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  canvasElement.appendTo('body');

  start_time = new Date();
  var worker = new Worker('js/balls_worker.js');
  worker.postMessage({'cmd': 'init', 'RADIUS':RADIUS, 'PARTICLE_RADIUS':PARTICLE_RADIUS, 'drop_radius':drop_radius})
  function request_worker() {
    idle = false;
    worker.postMessage({'cmd': 'execute'})
  }
  worker.addEventListener('message', function(e) {
    idle = true;
    var res = e.data;
    console.log(res.ball);
    if(res.drop_radius !== drop_radius) {console.log(drop_radius)}
    if(res.status === 'complete') {
      TIME += 2;
      draw_ball(res.ball);
      balls.push(res.ball);
      drop_radius = res.drop_radius;
    } else if(res.status ==='init') {
      draw_ball(res.ball);
      balls.push(res.ball);
    }
    if(res.drop_radius > RADIUS) {
      idle=false;
      console.log("Finished in: ", ((new Date())-start_time)/1000, 'sec');
      clearInterval(intervalID);
    }
  }, false);

  var intervalID = setInterval(function() {
    if(idle) {
      request_worker();
    }
  }, 1000/FPS);
})
function draw_ball(ball, color) {
  canvas.fillStyle = makeColor(TIME); 
  if(color) {canvas.fillStyle = color;}
  canvas.beginPath();
  canvas.arc(ball.x, ball.y, PARTICLE_RADIUS, 0, Math.PI*2, true);
  canvas.closePath();
  canvas.fill();
}
// Do Awesome Things With Colors!
function makeColor(index) {
  index = index || Math.floor(Math.random()*1530);
  function color(i) {
    // Wrap around using modulus 
    i = i % 1530;

    // Calculate the value
    var v;
    if(i < 255)       v = i;
    else if(i < 765)  v = 255;
    else if(i < 1020) v = 255 - (i - 765);
    else              v = 0;

    // Make it a zero-padded value
    v = v.toString(16);
    if(v.length == 1) return "0" + v;
    else              return v;
  }
  function red(i)   { return color(i + 510); }
  function green(i) { return color(i);        }
  function blue(i)  { return color(i + 1020);  }

  return "#" + red(index) + green(index) + blue(index);
}
