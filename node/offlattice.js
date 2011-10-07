var RADIUS = 200;
var PARTITION_WIDTH = 10;
var partition = []
var particleRadius = 1.0;
var particleDiameterSquared = (2*particleRadius)*(2*particleRadius);
var max_dist = 0;
var drop_radius = 25;
var start_time = new Date();
var UNIQUE_ID = 0;

var particles = {};

// Create partitions to avoid N*2 comparisons
for(var i=0; i < 2*RADIUS/PARTITION_WIDTH; i++) {
  partition[i] = [];
  for( var j=0; j < 2*RADIUS/PARTITION_WIDTH; j++) {
    partition[i][j] = new Partition(i, j); 
  }
}
// Create seed particle at center
console.log(partition[20][20]);
new Particle(RADIUS, RADIUS);

/*while(drop_radius < RADIUS) {
  var p = new Particle();
  while(!p.neighbors()) {
    var res = p.walk();
    if(!res) {
      p = new Particle();
    }
  }
  var dist = Math.floor((p.x-RADIUS)*(p.x-RADIUS)+(p.y-RADIUS)*(p.y-RADIUS));
  if(dist > max_dist) {max_dist = dist; drop_radius = Math.sqrt(dist)+25; }
}*/
for(var k in particles) {
  console.log(particles[k].x, particles[k].y, particles[k].id);
}
function Partition(i, j) {
  this.min_x = i*PARTITION_WIDTH;
  this.max_x = (i+1)*PARTITION_WIDTH;
  this.min_y = j*PARTITION_WIDTH;
  this.max_y = (j+1)*PARTITION_WIDTH;
  this.num_particles = 0;
  this.particles = {};
}
Partition.prototype.AddParticle = function(p) {
  p.partition = this;
  this.num_particles +=1;
  this.particles[p.id] = p;
}
Partition.prototype.RemoveParticle = function(p) {
  p.partition = undefined;
  this.num_particles += -1;
  delete this.particles[p.id];
}
Partition.prototype.Move = function(p, direction) {
  this.RemoveParticle(p);
  switch(direction) {
    case 'left': partition[this.i-1][this.j].AddParticle(p); break;
    case 'right':partition[this.i+1][this.j].AddParticle(p); break;
    case 'up':   partition[this.i][this.j-1].AddParticle(p); break;
    case 'down': partition[this.i][this.j+1].AddParticle(p); break;
  }
}
function Particle(x, y) {
  UNIQUE_ID++;
  this.id = UNIQUE_ID;
  var angle = Math.random()*2*Math.PI; 
  this.x = x || drop_radius*Math.cos(angle)+RADIUS;
  this.y = y || drop_radius*Math.sin(angle)+RADIUS;
  console.log(this);
  //partition[Math.floor(x/PARTITION_WIDTH)][Math.floor(y/PARTITION_WIDTH)].AddParticle(this);
  particles[this.id] = this;
  return this;
}
Particle.prototype.destroy = function() {
  this.partition.RemoveParticle(this);
  delete particles[this.id];
  console.log("destroyed", this.x, this.y);
}
Particle.prototype.walk = function() {
  var angle = Math.random()*2*Math.PI;
  this.x += particleRadius*Math.sin(angle);
  this.y += particleRadius*Math.cos(angle);
  if(this.x < 0 || this.y < 0) { this.destroy; return false;}
  if(this.x > 2*RADIUS || this.y > 2*RADIUS) { this.destroy; return false}

  this.updatePartition();
  return this;
}
Particle.prototype.updatePartition = function() {
  var current_partition = this.partition;
  if(this.x < current_partition.min_x) this.partition.Move(this, 'left');
  if(this.x > current_partition.max_x) this.partition.Move(this, 'right');
  if(this.y < current_partition.min_y) this.partition.Move(this, 'down');
  if(this.y > current_partition.max_y) this.partition.Move(this, 'up');
}
Particle.prototype.has_neighbor = function() {
  if(this.partition.num_particles == 1) {
    return false;
  }
  var d = this.partition.particles.map(function(p) {(p.x-this.x)*(p.x-this.x)+(p.y-this.y)*(p.y-this.y)})
  var filtered = d.filter(overlapping)
  return !!filtered.length;
}
function overlapping(element, index, array) {
  return element < particleDiameterSquared;
}
