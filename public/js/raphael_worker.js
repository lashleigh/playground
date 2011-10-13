importScripts('underscore-min.js');
importScripts('tree.js');
var RADIUS;
var DIMENSION;
var PARTICLE_RADIUS = 0.5;
var PARTICLE_DIAMETER = 2*PARTICLE_RADIUS;
var DIAMETER_SQUARED = PARTICLE_DIAMETER*PARTICLE_DIAMETER;
var STEP_SIZE = PARTICLE_RADIUS/4;
var UNIQUE_ID = 0;

var max_dist = 0;
var drop_radius;

var particles = [];
var trunk;

function init(data) {
  RADIUS = data.RADIUS;
  drop_radius = data.drop_radius;
  DIMENSION = 2*RADIUS;
  trunk = new QuadTree(null, 0, DIMENSION, 0, DIMENSION);

  var p = new Particle(RADIUS, RADIUS);
  particles.push(p);
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
    self.postMessage({'status':'response', 'tree':trunk, 'balls':particles});
  }
}, false);

function execute() {
  var p = new Particle();
  var stat = 'walk';
  var res;
  while(stat !== 'neighbor') {
    res = p.predictive_walk(PARTICLE_RADIUS, DIMENSION, trunk);
    p = res.p;
    stat = res.stat;
    if(stat==='destroy') {
      p = new Particle();
      stat = 'walk';
    }
  }
  trunk.Insert(p);
  particles.push(p);
  if(res.dist > max_dist) {
    max_dist=res.dist; 
    drop_radius = max_dist+25*PARTICLE_RADIUS;
  }
  self.postMessage({'status':'complete', 'ball':p, 'drop_radius':drop_radius});
}
