var balls = [];
var sim;
var trunk;

function init(h) {
  var that = this;

  this.balls = [];
  this.RADIUS = h['dim'] ? Math.floor(h['dim']) : 300;
  this.PARTICLE_RADIUS = h['radius'] ? parseFloat(h['radius']) : 3;
  this.drop_radius = 25;
  this.idle = true;
  this.FPS = 60;
  this.TIME = Math.floor(Math.random()*1500);
  this.execute = request_worker;
  this.start_time = new Date();
  this.intervalID;

  var canvas;
  var CANVAS_WIDTH = 2*that.RADIUS;
  var CANVAS_HEIGHT = 2*that.RADIUS;

  var canvasElement = $("<canvas width='" + CANVAS_WIDTH + 
                        "' height='" + CANVAS_HEIGHT + "'></canvas>");
  canvas = canvasElement.get(0).getContext("2d");
  canvas.fillStyle = '#fff';
  canvas.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  canvasElement.appendTo('body');

  var worker = new Worker('js/balls_worker.js');
  worker.postMessage({'cmd': 'init', 'RADIUS':that.RADIUS, 'PARTICLE_RADIUS':that.PARTICLE_RADIUS, 'drop_radius':that.drop_radius})
  
  function request_worker(command) {
    command = command || 'execute';
    if(command==='execute') {that.idle = false;}
    worker.postMessage({'cmd': command})
  }
  worker.addEventListener('message', function(e) {
    that.idle = true;
    var res = e.data;
    //console.log(res.ball);
    if(res.status === 'complete') {
      that.TIME += 2;
      draw_ball(res.ball);
      that.balls.push(res.ball);
      that.drop_radius = res.drop_radius;
    } else if(res.status ==='init') {
      draw_ball(res.ball);
      that.balls.push(res.ball);
      console.log(res);  
    } else if(res.status === 'response') {
      console.log(res); 
      trunk = res.tree;
    }
    if(res.drop_radius > that.RADIUS) {
      that.idle=false;
      console.log("Finished in: ", ((new Date())-that.start_time)/1000, 'sec');
      clearInterval(that.intervalID);
    }
  }, false);

  function draw_ball(ball, color) {
    canvas.fillStyle = makeColor(that.TIME); 
    if(color) {canvas.fillStyle = color;}
    canvas.beginPath();
    canvas.arc(ball.x, ball.y, that.PARTICLE_RADIUS, 0, Math.PI*2, true);
    canvas.closePath();
    canvas.fill();
  }
}
init.prototype.pause = function() {
  this.idle = false;
  clearInterval(this.intervalID);
}
init.prototype.play = function() {
  this.idle = true;
  if(this.drop_radius < this.RADIUS) {
    this.intervalID = setInterval(function() {
      if(sim.idle) {
        sim.execute();
      }
    }, 1000/sim.FPS);
  }
}
function newSim(h) {
  if(h) {
    sim = new init(h);
  } else {
    get_options_from_form();
  }
  sim.play();
}
function get_options_from_form() {
  var res = {};
  if(document.getElementById("radius").checkValidity()) {res['dim'] = document.getElementById("radius").value;}
  //if(document.getElementById("stick").checkValidity())  {res['stick'] = document.getElementById("stick").value;}
  if(document.getElementById("ppp").checkValidity())    {res['radius'] =   document.getElementById("ppp").value;}
  console.log(res);
  newSim(res)
}
