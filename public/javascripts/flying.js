var space;
window.onload = function() {
  space = new setup();
  var gui = new DAT.GUI();
  gui.add(space, 'speed').min(0).max(9)
  gui.add(space, 'fov').min(0).max(360).onFinishChange(function(newValue) {
    space.reseed;
  })
  gui.add(space, 'reverse');
  gui.add(space, 'reseed');
}
function setup() {
  var that = this;

  this.reverse = false;
  this.speed = 2;
  this.fov = 250;
  this.points = [];
  this.reseed = initPoints;

  var SCREEN_WIDTH = 600; 
  var SCREEN_HEIGHT = 300; 

  var HALF_WIDTH = SCREEN_WIDTH/2; 
  var HALF_HEIGHT = SCREEN_HEIGHT/2; 

  var numPoints = 1000; 
  
  function draw3Din2D(point3d) {  
    x3d = point3d[0];
    y3d = point3d[1]; 
    z3d = point3d[2]; 
    var scale = that.fov/(that.fov+z3d); 
    var x2d = (x3d * scale) + HALF_WIDTH;   
    var y2d = (y3d * scale)  + HALF_HEIGHT;
    
    c.fillStyle = "rgb(255,255,255)";     
    c.beginPath();
    c.rect(x2d, y2d, scale, scale);
    c.closePath();
    c.fill();
  }
  
  var canvas = document.getElementById('Canvas2D');
  var c = canvas.getContext('2d');
  
  function initPoints() {
    that.points = [];
    for (i=0; i<numPoints; i++) {
      point = [(Math.random()*400)-200, (Math.random()*400)-200 , (Math.random()*400)-200 ];
      that.points.push(point); 
    }
  }

  function render() {
      c.fillStyle="rgb(0,0,0)";
      c.fillRect(0,0, SCREEN_WIDTH, SCREEN_HEIGHT);
      
      for (i=0; i<numPoints; i++) {
        point3d = that.points[i]; 
        
        z3d = point3d[2]; 
        if(that.reverse) {
          z3d +=that.speed; 
          if(z3d > 0) z3d -=that.fov; 
        } else {
          z3d -=that.speed; 
          if(z3d <-that.fov) z3d += that.fov; 
        }
        point3d[2] = z3d; 
        
        draw3Din2D(point3d); 
    }
  }

  initPoints();
  var loop = setInterval(function(){render();}, 50);
}


var simulation;
function sim() {
  simulation = new init();
  new_canvas(simulation);
  load_data_gui(simulation);

  document.onkeydown = function(evt){    
    console.log(evt.keyCode);
    if(evt.keyCode == 32 ){
      simulation.pause();
    } 
  }  
}
function load_data_gui(sim) {
   var gui = new DAT.GUI();
}
function init() {
  this.CANVAS_WIDTH = 600;
  this.CANVAS_HEIGHT = 600;
  this.pause = function() {alert ("slow down")}
}
function new_canvas(sim) {
  var canvasElement = document.createElement("canvas");
  canvasElement.width = sim.CANVAS_WIDTH;
  canvasElement.height = sim.CANVAS_HEIGHT;
  document.body.appendChild(canvasElement);
  sim.context = canvasElement.getContext("2d");
}
function Planet(x, y, vx, vy, r) {

}
