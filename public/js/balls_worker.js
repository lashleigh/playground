importScripts('underscore-min.js');
var RADIUS;
var PARTICLE_RADIUS;
var STEP_SIZE;
var DIAMETER_SQUARED;
var BLOCK_WIDTH = 50; //RADIUS/(particleRadius*2*10);
var PARTITION_DIM;
var UNIQUE_ID = 0;

var max_dist = 0;
var drop_radius;

var free_ball;
var balls = [];
var partition = [];

function init(data) {
  RADIUS = data.RADIUS;
  PARTICLE_RADIUS = data.PARTICLE_RADIUS;
  drop_radius = data.drop_radius;
  STEP_SIZE = PARTICLE_RADIUS/2;
  DIAMETER_SQUARED = 4*PARTICLE_RADIUS*PARTICLE_RADIUS;
  PARTITION_DIM = 2*RADIUS/BLOCK_WIDTH;

  init_partition();
  var ball = new Ball(RADIUS, RADIUS);
  balls.push(ball);
  self.postMessage({'status':'init', 'ball':ball, 'message':'Initialize', 'RADIUS':RADIUS});
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
  self.postMessage({'status':'complete', 'ball':free_ball, 'drop_radius':drop_radius});
}
function handleCollisions() {
  var near = _.select(balls, nearby);
  var distances = _.map(near, function(b) {return {'p':b, 'dist': distance_squared(free_ball, b)}});
  var filtered = _.select(distances, overlapping);
  //self.postMessage({'status':'debug', 'ball':free_ball, 'distance':distances});
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
  
  partition[Math.floor(this.x/BLOCK_WIDTH)][Math.floor(this.y/BLOCK_WIDTH)].AddParticle(this);
  //this.nearby = this.NearestParticles();

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
    this.updatePartition();
    return this;
  }
}
Ball.prototype.NearestParticles = function() {
  var neighbors = [];
  neighbors.push(this.block.particles);
  var left  = this.x - this.block.min_x < PARTICLE_RADIUS
  var up    = this.y - this.block.min_y < PARTICLE_RADIUS
  var right = this.block.max_x - this.x < PARTICLE_RADIUS
  var down  = this.block.max_y - this.y < PARTICLE_RADIUS

  if(left)      {if(check_partition(this.block.i-1, this.block.j  )){ neighbors.push(partition[this.block.i-1][this.block.j  ].particles)}}
  else if(right){if(check_partition(this.block.i+1, this.block.j  )){ neighbors.push(partition[this.block.i+1][this.block.j  ].particles)}}
  if(up)        {if(check_partition(this.block.i  , this.block.j-1)){ neighbors.push(partition[this.block.i  ][this.block.j-1].particles)}}
  else if(down) {if(check_partition(this.block.i  , this.block.j+1)){ neighbors.push(partition[this.block.i  ][this.block.j+1].particles)}}
  
  if(left && up)        {if(check_partition(this.block.i-1, this.block.j-1)){ neighbors.push(partition[this.block.i-1][this.block.j-1].particles)}}
  else if(left && down) {if(check_partition(this.block.i-1, this.block.j+1)){ neighbors.push(partition[this.block.i-1][this.block.j+1].particles)}}
  else if(right && up)  {if(check_partition(this.block.i+1, this.block.j-1)){ neighbors.push(partition[this.block.i+1][this.block.j-1].particles)}}
  else if(right && down){if(check_partition(this.block.i+1, this.block.j+1)){ neighbors.push(partition[this.block.i+1][this.block.j+1].particles)}}
  return _.union(neighbors);

  function check_partition(i, j) {
    return !!(partition[i] && partition[i][j]);  
  }
}
Ball.prototype.updatePartition = function() {
  var old = this.block;
  if(this.x < this.block.min_x) this.block.Move(this, 'left');
  if(this.x > this.block.max_x) this.block.Move(this, 'right');
  if(this.y < this.block.min_y) this.block.Move(this, 'up');
  if(this.y > this.block.max_y) this.block.Move(this, 'down');
  //if(this.block !== old) {
  //  this.nearby = this.NearestParticles();
  //}
}
Ball.prototype.destroy = function() {
  delete this;
}
function init_partition() {
  for(var i=0; i < PARTITION_DIM; i++) {
    partition[i] = [];
    for( var j=0; j < PARTITION_DIM; j++) {
      partition[i][j] = new Block(i, j); 
    }
  }
}
function Block(i, j) {
  this.i = i;
  this.j = j;
  UNIQUE_ID++;
  this.id = "BLOCK_"+UNIQUE_ID;
  this.min_x = i*BLOCK_WIDTH;
  this.max_x = (i+1)*BLOCK_WIDTH;
  this.min_y = j*BLOCK_WIDTH;
  this.max_y = (j+1)*BLOCK_WIDTH;
  this.num_particles = 0;
  //this.particles = {};
  this.particles = [];
}
Block.prototype.AddParticle = function(p) {
  p.block = this;
  this.num_particles +=1;
  this.particles[p.id] = p;
}
Block.prototype.RemoveParticle = function(p) {
  p.block = undefined;
  this.num_particles += -1;
  delete this.particles[p.id];
}
Block.prototype.Move = function(p, direction) {
  if(p.block) this.RemoveParticle(p);
  switch(direction) {
    case 'left': partition[(this.i-1+PARTITION_DIM) % PARTITION_DIM][this.j].AddParticle(p); break;
    case 'right':partition[(this.i+1) % PARTITION_DIM][this.j].AddParticle(p); break;
    case 'up':   partition[this.i][(this.j-1+PARTITION_DIM) % PARTITION_DIM].AddParticle(p); break;
    case 'down': partition[this.i][(this.j+1) % PARTITION_DIM].AddParticle(p); break;
  }
}
Block.prototype.NeighboringBlocks = function() {
  var neighbors = [];
  neighbors.push(this.particles);
  if(this.i > 0) { neighbors.push(partition[this.i-1][this.j].particles)}
  if(this.i < PARTITION_DIM-1) { neighbors.push(partition[this.i+1][this.j].particles)}
  if(this.j > 0) { neighbors.push(partition[this.i][this.j-1].particles)}
  if(this.j < PARTITION_DIM-1) {neighbors.push(partition[this.i][this.j+1].particles)}
  return _.union(neighbors);
  //return _.union(_.map(neighbors, function(n) {n.particles}))
}

