importScripts('underscore-min.js');
importScripts('tree.js');
var RADIUS;
var CANVAS_WIDTH;
var PARTICLE_RADIUS;
var STEP_SIZE;
var DIAMETER_SQUARED;
var UNIQUE_ID = 0;

var max_dist = 0;
var drop_radius;

var particles = [];
var trunk;

function init(data) {
  RADIUS = data.RADIUS;
  PARTICLE_RADIUS = data.PARTICLE_RADIUS;
  drop_radius = data.drop_radius;
  STEP_SIZE = PARTICLE_RADIUS/4;
  DIAMETER_SQUARED = 4*PARTICLE_RADIUS*PARTICLE_RADIUS;
  CANVAS_WIDTH = 2*RADIUS;
  trunk = new QuadTree(null, 0, 2*RADIUS, 0, 2*RADIUS);

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
    res = p.vector_walk(PARTICLE_RADIUS, CANVAS_WIDTH, trunk);
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
    drop_radius = max_dist+8*PARTICLE_RADIUS;
  }
  self.postMessage({'status':'complete', 'ball':p, 'drop_radius':drop_radius});
}
