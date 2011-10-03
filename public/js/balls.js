var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 320;
var balls = [];
var canvas;

$(function() {
  var canvasElement = $("<canvas width='" + CANVAS_WIDTH + 
                        "' height='" + CANVAS_HEIGHT + "'></canvas>");
  canvas = canvasElement.get(0).getContext("2d");
  canvasElement.appendTo('body');
  
  var FPS = 30;
  setInterval(function() {
    update();
    draw();
  }, 1000/FPS);
  for(var i = 0; i < 15; i++) {
    balls.push(new Ball());
  }
})
function update() {
  for(var i=0; i < balls.length; i++) {
    balls[i].update();
  }
  handleCollisions();
}

function draw() {
  canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.fillStyle = "#000";
  for(var i = 0; i < balls.length; i++) {
  canvas.beginPath();
  canvas.arc(balls[i].x_pos, balls[i].y_pos, 10, 0, Math.PI*2, true);
  canvas.closePath();
  canvas.fill();
    //canvas.fillText("Sup Bro!"+i, balls[i].x_pos, balls[i].y_pos);
  }
}
function collides(a, b) {
  return a.x_pos < b.x_pos + b.width &&
  a.x_pos + a.width > b.x_pos &&
  a.y_pos < b.y_pos + b.height &&
  a.y_pos + a.height > b.y_pos;
}
function handleCollisions() {
  for(var i = 0; i < balls.length; i++) {
    for(var j = i+1; j < balls.length; j++) {
      if(collides(balls[i], balls[j])) {
        var temp_x = balls[i].x_vel;
        var temp_y = balls[i].y_vel;
        balls[i].x_vel = balls[j].x_vel;
        balls[i].y_vel = balls[j].y_vel;
        balls[j].x_vel = temp_x;
        balls[j].y_vel = temp_y;
      };
    }
  }
}
Ball = (function() {
  function Ball() {
    this.x_pos = CANVAS_WIDTH*Math.random();
    this.y_pos = CANVAS_HEIGHT*Math.random();
    this.x_vel = 1+Math.random();
    this.y_vel = 1+Math.random();
    this.width = 15;
    this.height = 15;
  }
  Ball.prototype.update = function() {
    this.x_pos += this.x_vel; 
    this.y_pos += this.y_vel;
    if(this.x_pos > CANVAS_WIDTH) {
      this.x_pos = CANVAS_WIDTH;
      this.x_vel = -this.x_vel;
    }
    if(this.y_pos > CANVAS_HEIGHT) {
      this.y_pos = CANVAS_HEIGHT;
      this.y_vel = -this.y_vel;
    }
    if(this.x_pos < 0) {
      this.x_pos = 0;
      this.x_vel = -this.x_vel;
    }
    if(this.y_pos < 0) {
      this.y_pos = 0;
      this.y_vel = -this.y_vel;
    }
  };
  return Ball;
})();
