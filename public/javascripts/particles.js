
var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 600;
var X_STEP = 15;
var Y_STEP = 16;
var X_MAX = Math.floor(CANVAS_WIDTH/X_STEP);
var Y_MAX = Math.floor(CANVAS_HEIGHT/Y_STEP);

var expired = {};
var particles = {};
var on_top = {};
var free_to_move = {};
var context;
var canvasElement;
var grid = [];

var free_particle;
var simulation;

$(function() {
  simulation = new init();

  canvasElement = document.createElement("canvas");
  canvasElement.width = simulation.CANVAS_WIDTH;
  canvasElement.height = simulation.CANVAS_HEIGHT;
  document.body.appendChild(canvasElement);
  
  context = canvasElement.getContext("2d");
  reset_grid();
  //drawGrid();
  load_data_gui();

  canvasElement.addEventListener('click', function(e) {
    coords = mouse_to_grid(e);
    simulation.add_particle(coords[0], coords[1]);
  }, false)
})
function load_data_gui() {

   var gui = new DAT.GUI();

   // Sliders with min + max
   gui.add(simulation, 'FPS').min(0).max(9).onFinishChange(function(newValue) {
     simulation.pause();
     simulation.FPS = Math.exp(newValue);
     simulation.play();
   });
   //gui.add(simulation, 'growthSpeed').min(0.01).max(1).step(0.05);
   //gui.add(simulation, 'speed', 0.1, 2, 0.05); // shorthand for min/max/step

   //gui.add(simulation, 'noiseStrength', 10, 100, 5);

   gui.add(simulation, 'num_particles').listen();
   // Boolean checkbox
   gui.add(simulation, 'is_paused').name('Pause').listen().onChange(function(newValue) {
     if(simulation.is_paused) {
       simulation.pause();
     } else {
       simulation.play();
     }
   });

   // Fires a function called 'explode'
   gui.add(simulation, 'hundred').name('Hundred more!'); // Specify a custom name.
   gui.add(simulation, 'one_by_one').name('One by one'); // Specify a custom name.

   gui.add(simulation, 'probability_cutoff').min(0).max(1).onFinishChange(function(newValue) {
     simulation.pause();
     simulation.probability_cutoff = newValue;
     simulation.play();
   });
   gui.add(simulation, 'by_dice').name('Roll the dice'); // Specify a custom name.
   gui.add(simulation, 'clear').name('Clear'); // Specify a custom name.
}
function init() {
  var that = this;

  this.particles = [];
  this.FPS = 1;
  this.hundred = function() { 
    for(var i=0; i<100; i++) { new_particle();};
  }
  this.is_paused = true;
  this.pause = function() { this.is_paused = true; clearInterval(that.intervalID);}
  this.play = playSimulation;
  this.probability_cutoff = 0.5;
  this.num_particles = this.particles.length;

  this.CANVAS_WIDTH = 800;
  this.CANVAS_HEIGHT = 600;
  this.X_STEP = 5;
  this.Y_STEP = 5;
  this.X_MAX = Math.floor(CANVAS_WIDTH/X_STEP);
  this.Y_MAX = Math.floor(CANVAS_HEIGHT/Y_STEP);

  this.add_particle = new_particle;
  this.intervalID;
  this.one_by_one = function() { this.execute = walk_one; this.play()};
  this.by_dice = function() { this.execute = roll_the_dice; this.play()}//this.is_paused = false; this.play();};
  this.execute = this.one_by_one;
  this.clear = reset;

  function walk_one() {
    if(free_particle && !free_particle.cluster) {
      free_particle.walk();
    } else {
      free_particle = new_particle();
    }
  }
  function roll_the_dice() {
    p = Math.random();
    if( p >= that.probability_cutoff) {
      new_particle();
    } else {
      for(var i in free_to_move) {
      free_to_move[i].walk();
      }
    }
  }
  function hundred_moves() {
    for(var i=0; i< 100; i++) {
      keys = get_keys(free_to_move);
      if(keys.length > 0) {
        n = Math.floor(Math.random()*keys.length)
        pn = free_to_move[keys[n]];
        pn.walk();
      } else {
        //new_particle();
      }
    }
  }
  function thousand_moves() {
    for(var i=0; i<100; i++) {
      hundred_moves();
    }
  }
  function new_particle(x, y) {
    p = new Particle(x, y);
    on_top[p.id] = p;
    particles[p.id] = p;
    p.draw();
    that.particles.push(p);
    that.num_particles += 1;
    return p;
  }
  function Cluster() {
    this.id = Math.floor((new Date()).getTime()*Math.random())
    this.particles = [];
    this.color_levels = [Math.floor(200*Math.random()),Math.floor(200*Math.random()), Math.floor(200*Math.random())];
  }
  Cluster.prototype = {
    color: function() { return "rgba("+this.color_levels[0]+","+this.color_levels[1]+","+this.color_levels[2]+",1.0)";}
  }
  Cluster.prototype.merge = function(other) {
    if(this !== other) {
      for(var i=0; i < other.particles.length; i++) {
        var p = other.particles[i];
        this.particles.push(p);
        p.cluster = this;
        p.draw();
      }
      other.particles = [];
      delete other;
    }
  }
  function random_side(max) {
    if(Math.random() >=0.5 ){ 
      return 0; 
    } else {
      return max-1;
    }
  }
  function Particle(I_x, I_y) {
    this.x = I_x !== undefined ? I_x : Math.floor(X_MAX*Math.random());
    this.y = I_y !== undefined ? I_y : Math.floor(Y_MAX*Math.random()); 
    this.id = "id_"+Math.floor((new Date()).getTime()*Math.random())
    //this.color_levels = [Math.floor(200*Math.random()),Math.floor(200*Math.random()), Math.floor(200*Math.random())];
    this.cluster;
    this.level = 1;
  
    this.check_for_neighbors();
    this.add_to_stack();
  }
  Particle.prototype = {
    stack: function() { return grid[this.x][this.y];},
    neigh_x: function(step) { return grid[(this.x+step+X_MAX) % X_MAX][this.y];},
    neigh_y: function(step) { return grid[this.x][(this.y+step+Y_MAX) % Y_MAX];},
    color: function() { return "rgba("+this.color_levels[0]+","+this.color_levels[1]+","+this.color_levels[2]+","+this.level/1.0+")";}
  }
  Particle.prototype.merge_clusters = function(topped) {
    if(this.cluster && topped.cluster) {
      this.cluster.merge(topped.cluster);
    } else if(this.cluster) {
      topped.cluster = this.cluster;
      topped.cluster.particles.push(topped);
    } else if(topped.cluster) {
      this.cluster = topped.cluster;
      this.cluster.particles.push(this);
    } else {
      c = new Cluster();
      this.cluster = c;
      topped.cluster = c;
      c.particles.push(this);
      c.particles.push(topped);
    }
    topped.draw();
    this.draw();
    delete free_to_move[topped.id]
    delete free_to_move[this.id]
  }
  Particle.prototype.add_to_stack = function() {
    var stack = this.stack()
    if(stack.length > 0) {
      var topped = stack[stack.length-1]
      delete on_top[topped.id]; 
      this.merge_clusters(topped);
    }
    stack.push(this);
    this.level = stack.length;
  }
  Particle.prototype.check_for_neighbors = function() {
    var num = 0;
    num += this.merge_if_not_empty(this.stack());
    num += this.merge_if_not_empty(this.neigh_x(-1));
    num += this.merge_if_not_empty(this.neigh_x( 1));
    num += this.merge_if_not_empty(this.neigh_y(-1));
    num += this.merge_if_not_empty(this.neigh_y( 1));
    if(num == 0) {
      if(this.cluster) {
        this.cluster.particles.splice(this.cluster.particles.indexOf(this), 1)
      }
      this.cluster = undefined; 
      free_to_move[this.id] = this;
    } else {
      delete free_to_move[this.id];  
    }
  }
  Particle.prototype.merge_if_not_empty = function(stack) {
    if(stack.length > 0) {
      this.merge_clusters(stack[stack.length-1])
    }
    return stack.length;
  }
  Particle.prototype.draw = function() {
    this.clear();
    context.fillStyle = this.cluster ? this.cluster.color() : "#ccc"; //this.color(); // "rgba(5, 5, 5, "+this.level/10.0+")"
    context.beginPath();
    //context.rect(this.x*X_STEP+1, this.y*Y_STEP+1, X_STEP-2, Y_STEP-2) 
    context.rect(this.x*X_STEP, this.y*Y_STEP, X_STEP, Y_STEP) 
    context.closePath();
    context.fill();
    context.fillStyle = "#fff";
    context.font      = 'italic '+X_STEP/2+'px sans-serif';
    context.fillText(this.level, this.x*X_STEP+X_STEP/3, this.y*Y_STEP+Y_STEP/1.5);
  }
  Particle.prototype.clear = function() {
    //context.clearRect(this.x*X_STEP+1, this.y*Y_STEP+1, X_STEP-2, Y_STEP-2);
    context.clearRect(this.x*X_STEP, this.y*Y_STEP, X_STEP, Y_STEP);
  }
  Particle.prototype.free_grid = function() {
    var stack = this.stack();
    stack.pop();
    if(stack.length > 0) {
      var last = stack[stack.length-1]
      on_top[last.id] = last;
      last.draw();
    } else {
      this.clear()
    }
  }
  Particle.prototype.set_grid = function() {
    var stack = this.stack();
    if(stack.length > 0) {
      var last = stack[stack.length-1]
      delete on_top[last.id];
    }
    stack.push(this);
    this.level = this.stack().length; 
    this.draw();
  }
  Particle.prototype.walk = function() {
    var direction = Math.floor(Math.random()*4)
  
    switch(direction) {
      case 0: this.move_to('x', -1);  break;
      case 1: this.move_to('x',  1);  break;
      case 2: this.move_to('y', -1);  break;
      case 3: this.move_to('y',  1);  break;
    } 
  }
  Particle.prototype.destroy = function() {
    this.free_grid();
    delete on_top[this.id];
    delete particles[this.id]
    expired[this.id] = this;
    delete this;
  }
  Particle.prototype.move_to = function(which, step) {
    var max;
    if(which === 'x') { 
      max = X_MAX-1;
    } else if(which === 'y') { 
      max = Y_MAX-1; 
    }
    this.free_grid();
    if((0 <= this[which]+step) && (this[which]+step <= max)) {
      this[which] += step;
    } else if(step == 1) {
      this[which] = 0;
    } else if(step == -1) {
      this[which] = max;
    }
    this.check_for_neighbors();
    this.set_grid();
  }
  function get_keys(hash) {
    var keys = [];
    for(var i in hash) if (hash.hasOwnProperty(i))
    {
      keys.push(i);
    }
    return keys;
  }
  function playSimulation() {
    that.is_paused = false;
    that.intervalID = setInterval(function() {
    //roll_the_dice();
      that.execute();
     }, 1000/that.FPS);
  }
  function drawGrid() {
    context.beginPath();
    for (var x = 0; x <= CANVAS_WIDTH; x += X_STEP) {
      context.moveTo(x, 0);
      context.lineTo(x, Y_MAX*Y_STEP);
    }
    for (var y = 0; y <= CANVAS_HEIGHT; y += Y_STEP) {
      context.moveTo(0, y);
      context.lineTo(X_MAX*X_STEP, y);
    }
    context.strokeStyle = "#eee";
    context.stroke();
    context.closePath();
  }
}
function mouse_to_grid(e) {
  var x;
  var y;
  if (e.pageX || e.pageY) { 
    x = e.pageX;
    y = e.pageY;
  }
  else { 
    x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
    y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
  } 
  x -= canvasElement.offsetLeft;
  y -= canvasElement.offsetTop;
  return [Math.floor(x/X_STEP), Math.floor(y/Y_STEP)];
}
function reset_grid() {
  for(var i = 0; i < X_MAX; i++) {
    grid[i] = [];
    for(var j = 0; j < Y_MAX; j++) {
    grid[i][j] = [];
    }
  }
}
function reset() {
  reset_grid();
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  simulation.pause(); 
  simulation.is_paused=true;
  simulation.particles = []
  simulation.num_particles = 0;
  expired = {};
  particles = {};
  on_top = {};
  free_to_move = {};
}

