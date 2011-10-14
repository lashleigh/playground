var balls = [];
var sim;
var trunk;
var canvas;

function init(h) {
  var that = this;

  this.balls = [];
  this.RADIUS = h['dim'] ? Math.floor(h['dim']) : 300;
  this.ppp = h['ppp'] ? parseFloat(h['ppp']) : 3;
  this.PARTICLE_RADIUS = 0.5;
  this.PARTICLE_DIAMETER = 1.0;
  this.drop_radius = 50;
  this.idle = true;
  this.FPS = 60;
  this.TIME = Math.floor(Math.random()*1500);
  this.execute = request_worker;
  this.start_time = new Date();
  this.intervalID;

  var CANVAS_WIDTH = 2*that.RADIUS*that.ppp;
  var CANVAS_HEIGHT = 2*that.RADIUS*that.ppp;

  var canvasElement = $("<canvas width='" + CANVAS_WIDTH + 
                        "' height='" + CANVAS_HEIGHT + "'></canvas>");
  canvas = canvasElement.get(0).getContext("2d");
  canvas.fillStyle = '#fff';
  canvas.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  canvasElement.appendTo('body');

  var worker = new Worker('js/raphael_worker.js');
  worker.postMessage({'cmd': 'init', 'RADIUS':that.RADIUS, 'drop_radius':that.drop_radius})
  
  function request_worker(command) {
    command = command || 'execute';
    //if(command==='execute') {that.idle = false;}
    worker.postMessage({'cmd': command})
  }
  worker.addEventListener('message', function(e) {
    that.idle = true;
    var res = e.data;
    //console.log(res.ball);
    if(res.status === 'complete') {
      that.TIME += 15;
      res.balls.forEach(function(p) {draw_ball(p); that.balls.push(p)})
      //draw_ball(res.ball);
      //that.balls.push(res.ball);
      that.drop_radius = res.drop_radius;
    } else if(res.status ==='init') {
      console.log(res);  
      draw_ball(res.ball);
      that.balls.push(res.ball);
    } else if(res.status === 'response') {
      console.log(res); 
      trunk = res.tree;
    }
    if(res.drop_radius > that.RADIUS) {
      worker.terminate()
      that.idle=false;
      console.log("Finished in: ", ((new Date())-that.start_time)/1000, 'sec');
      clearInterval(that.intervalID);
    }
  }, false);

  function draw_ball(ball, color) {
    canvas.fillStyle = makeColor(that.TIME); 
    if(color) {canvas.fillStyle = color;}
    canvas.beginPath();
    canvas.arc(ball.x*that.ppp, ball.y*that.ppp, that.PARTICLE_RADIUS*that.ppp, 0, Math.PI*2, true);
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
  //sim.play();
  sim.execute();
}
function get_options_from_form() {
  var res = {};
  if(document.getElementById("radius").checkValidity()) {res['dim'] = document.getElementById("radius").value;}
  //if(document.getElementById("stick").checkValidity())  {res['stick'] = document.getElementById("stick").value;}
  if(document.getElementById("ppp").checkValidity())    {res['ppp'] =   document.getElementById("ppp").value;}
  console.log(res);
  newSim(res)
}
function draw_quad_tree(trunk) {
  find_branches(trunk);
}
function find_branches(b) {
  if(b.nw) {
  console.log(b);
    find_branches(b.nw);
    find_branches(b.sw);
    find_branches(b.ne);
    find_branches(b.se);
  } else {
    draw_branch(b);
  } 
}
function draw_branch(b) {
  //b.rect = paper.rect(ppp*b.x_min, ppp*b.y_min, ppp*(b.x_max-b.x_min), ppp*(b.y_max-b.y_min)); 
  canvas.strokeRect(sim.ppp*b.x_min, sim.ppp*b.y_min, sim.ppp*(b.x_max-b.x_min), sim.ppp*(b.y_max-b.y_min)); 
  
  //canvas.moveTo(ppp*b.x_min, ppp*b.y_min); // give the (x,y) coordinates
  //canvas.lineTo(ppp*b.x_max, ppp*b.y_min);  
  //canvas.lineTo(ppp*b.x_max, ppp*b.y_max); // give the (x,y) coordinates
  //canvas.lineTo(ppp*b.x_min, ppp*b.y_max);  
  //canvas.lineTo(ppp*b.x_min, ppp*b.y_max);  

  canvas.fill();
}


