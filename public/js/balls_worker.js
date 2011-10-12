importScripts('underscore-min.js');
importScripts('tree.js');
var RADIUS;
var PARTICLE_RADIUS;
var STEP_SIZE;
var DIAMETER_SQUARED;
var UNIQUE_ID = 0;

var max_dist = 0;
var drop_radius;

var free_ball;
var balls = [];
var trunk;

function init(data) {
  RADIUS = data.RADIUS;
  PARTICLE_RADIUS = data.PARTICLE_RADIUS;
  drop_radius = data.drop_radius;
  STEP_SIZE = PARTICLE_RADIUS/4;
  DIAMETER_SQUARED = 4*PARTICLE_RADIUS*PARTICLE_RADIUS;
  trunk = new QuadTree(null, 0, 2*RADIUS, 0, 2*RADIUS);

  var p = new Ball(RADIUS, RADIUS);
  balls.push(p);
  trunk.Insert(p);
  self.postMessage({'status':'init', 'ball':p, 'trunk':trunk, 'message':'Initialize', 'RADIUS':RADIUS});
}
self.addEventListener('message', function(e) {
  var data = e.data;
  if(data.cmd=== 'init') {
    init(data);
  } else if(data.cmd === 'execute') {
    if(RADIUS) {
      execute();
    } else {
      self.postMessage({'status':'error', 'message':'You must initialize first'});
    }
  } else if(data.cmd === 'data') {
    self.postMessage({'status':'response', 'tree':trunk, 'balls':balls});
  }
}, false);

function execute() {
  free_ball = new Ball();    
  while(!handleCollisions()) {
    free_ball = free_ball.walk();
    if(!free_ball) {
      free_ball = new Ball();
    }
  }
  var dist = distance(free_ball, {'x':RADIUS, 'y':RADIUS});
  if(dist > max_dist) {max_dist = dist; drop_radius = dist+25;}
  balls.push(free_ball);
  trunk.Insert(free_ball);
  self.postMessage({'status':'complete', 'ball':free_ball, 'drop_radius':drop_radius});
}
function handleCollisions() {
  var near = trunk.Search(free_ball); //_.select(balls, nearby);
  var distances = _.map(near, function(b) {return {'p':b, 'dist': distance_squared(free_ball, b)}});
  var filtered = _.select(distances, overlapping);
  if(filtered.length) {
    var min_p = _.min(filtered, function(p) {return p.dist});
    min_p.dist = Math.sqrt(min_p.dist);
    free_ball.x -= (2*PARTICLE_RADIUS-min_p.dist)*Math.cos(free_ball.angle)
    free_ball.y -= (2*PARTICLE_RADIUS-min_p.dist)*Math.sin(free_ball.angle)
    return true;
  }
  return false;
}
function overlapping(element, index, array) {
  return (element.dist < DIAMETER_SQUARED && element.dist !== 0);
}
function nearby(element, index, array) {
  return (Math.abs(element.x-free_ball.x) < 2*PARTICLE_RADIUS) || (Math.abs(element.y-free_ball.y) < 2*PARTICLE_RADIUS); 
}
function distance_squared(a, b) {
 return (a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y) 
}
function distance(a,b) {
  return Math.sqrt(distance_squared(a,b));
}
function Ball(x, y) {
  UNIQUE_ID++;
  this.id = UNIQUE_ID;
  this.angle = Math.random()*2*Math.PI;
  this.x = x || drop_radius*Math.cos(this.angle) + RADIUS; //CANVAS_WIDTH*Math.random();
  this.y = y || drop_radius*Math.sin(this.angle) + RADIUS; //CANVAS_HEIGHT*Math.random();
  
  return this;
}
Ball.prototype.walk = function() {
  this.angle = Math.random()*2*Math.PI;
  this.x += STEP_SIZE*Math.sin(this.angle);
  this.y += STEP_SIZE*Math.cos(this.angle);
  if(this.x < 0 || this.y < 0 || this.x > 2*RADIUS || this.y > 2*RADIUS) {
    this.destroy();
    return false;
  } else if(distance(this, {'x':RADIUS, 'y':RADIUS}) > drop_radius+25) {
    this.destroy();
    return false;
  } else {
    return this;
  }
}
Ball.prototype.destroy = function() {
  delete this;
}

