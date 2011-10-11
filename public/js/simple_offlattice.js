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
var FPS = 30;

$(function() {
  var canvasElement = $("<canvas width='" + CANVAS_WIDTH + 
                        "' height='" + CANVAS_HEIGHT + "'></canvas>");
  canvas = canvasElement.get(0).getContext("2d");
  canvasElement.appendTo('body');

  var worker = new Worker('js/balls_worker.js');
  worker.postMessage({'cmd': 'init', 'RADIUS':RADIUS, 'PARTICLE_RADIUS':PARTICLE_RADIUS, 'drop_radius':drop_radius})
  function request_worker() {
    idle = false;
    worker.postMessage({'cmd': 'execute'})
  }
  worker.addEventListener('message', function(e) {
    idle = true;
    var res = e.data;
    console.log(res);
    if(res.status === 'complete') {
      draw_ball(res.ball);
      balls.push(res.ball);
      drop_radius = res.drop_radius;
    } else if(res.status ==='init') {
      draw_ball(res.ball);
      balls.push(res.ball);
    }
  }, false);

  var intervalID = setInterval(function() {
    if(drop_radius > RADIUS) {
      clearInterval(intervalID);
    }
    if(idle) {
      request_worker();
      //update();
      //draw();
    }
  }, 1000/FPS);
})

function update() {
  if(free_ball) {
    free_ball = free_ball.walk();
  } else {
    free_ball = new Ball();
  }
  if(handleCollisions()) {
    var dist = distance(free_ball, {'x':RADIUS, 'y':RADIUS});
    if(dist > max_dist) {max_dist = dist; drop_radius = dist+25; console.log(drop_radius);}
    balls.push(free_ball);
    free_ball = new Ball();
  }
}
function draw_ball(ball, color) {
  canvas.fillStyle = "#000";
  if(color) {canvas.fillStyle = color;}
  canvas.beginPath();
  canvas.arc(ball.x, ball.y, PARTICLE_RADIUS, 0, Math.PI*2, true);
  canvas.closePath();
  canvas.fill();
}
function draw() {
  //canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.fillStyle = "#000";
  draw_ball(free_ball);
  //for(var i = 0; i < balls.length; i++) {
  //  draw_ball(balls[i]);
  //}
}
function collides(a, b) {
  return distance_squared(a,b) < DIAMETE_SQUARED;
}
function distance_squared(a, b) {
 return (a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y) 
}
function distance(a,b) {
  return Math.sqrt(distance_squared(a,b));
}
function handleCollisions() {
  var me = free_ball;
  var distances = _.map(balls, function(b) {return {'p':b, 'dist': distance_squared(free_ball, b)}});
  var filtered = _.select(distances, overlapping);
  if(filtered.length) {
    var min_p = _.min(filtered, function(p) {return p.dist});
    min_p.dist = Math.sqrt(min_p.dist);
    console.log(min_p);
    //while(min_p.dist < 2*PARTICLE_RADIUS) {
      me.x -= (2*PARTICLE_RADIUS-min_p.dist)*Math.cos(me.angle)
      me.y -= (2*PARTICLE_RADIUS-min_p.dist)*Math.sin(me.angle)
      //min_p.dist = distance(me, min_p.p); 
      console.log(min_p);
    //}
    return true;
  }
  return false;
}
function overlapping(element, index, array) {
  return (element.dist < DIAMETE_SQUARED && element.dist !== 0);
}

function Ball(x, y) {
  this.angle = Math.random()*2*Math.PI;
  this.x = x || drop_radius*Math.cos(this.angle) + RADIUS; //CANVAS_WIDTH*Math.random();
  this.y = y || drop_radius*Math.sin(this.angle) + RADIUS; //CANVAS_HEIGHT*Math.random();
  
  return this;
}
Ball.prototype.walk = function() {
  draw_ball(this, '#fff');
  this.angle = Math.random()*2*Math.PI;
  this.x += STEP_SIZE*Math.sin(this.angle);
  this.y += STEP_SIZE*Math.cos(this.angle);
  if(this.x < 0 || this.y < 0 || this.x > 2*RADIUS || this.y > 2*RADIUS) {
    this.destroy();
    return false;
  } else if(distance(this, {'x':RADIUS, 'y':RADIUS}) > drop_radius+25) {
    console.log(this, "outside zone");
    this.destroy();
    return false;
  } else {
    return this;
  }
};
Ball.prototype.destroy = function() {
  delete this;
}
