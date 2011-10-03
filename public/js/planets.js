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
