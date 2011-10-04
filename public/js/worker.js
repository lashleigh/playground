self.addEventListener('message', function(e) {
  var data = e.data;
  if(data.cmd == 'grid') { //switch (data.cmd) {
    var grid = data.grid
    var iter = 0;
    var coords = [];
    var edge = data.edge;
    var max_dist = 0;
    for(var i=0; i < data.num; i++) {
      var c = random_from_polar(edge, data.radius);
      var x = c.x; var y = c.y;
      while(coord_has_neighbor(grid, x, y, data.sticking_prob)==0) {
        var p = Math.floor(Math.random()*4)
        switch(p) {
          case 0: x = x+1; break;
          case 1: x = x-1; break;
          case 2: y = y+1; break;
          case 3: y = y-1; break;
        }
        if(!valid_coords(grid,x,y) || too_far_away(x,y,edge, data.radius, true)) {
          c = random_from_polar(edge, data.radius);
          x = c.x;
          y = c.y;
        }
        iter+=1;
      }
      var dist = (x-data.radius)*(x-data.radius)+(y-data.radius)*(y-data.radius);
      if(dist > max_dist) {max_dist = dist; edge = Math.sqrt(dist)+25; }
      grid[x][y] += 1;
      coords.push({'x':x, 'y':y});
    }
    self.postMessage({'iter':iter, 'coords':coords, 'edge':edge, 'max_dist':max_dist});
  };
}, false);

function too_far_away(x, y, radius, radius, delete_far) {
  if(delete_far) {
    x = x-radius;
    y = y-radius;
    r_squared = x*x+y*y;
    return r_squared > radius*radius + 10000; 
  } else {
    return false;
  }
}
function random_from_polar(r, radius) {
  var angle = Math.random()*2*Math.PI;
  var x = Math.floor(r*Math.cos(angle))+radius
  var y = Math.floor(r*Math.sin(angle))+radius
  return {'x':x, 'y':y};
}
function valid_coords(grid, x, y) {
  return grid[x] && grid[x][y] !== undefined;
}
function coord_has_neighbor(grid, x, y, sticking_prob) {
  var num=0;
  num+= occupied(x,y)   ? 1: 0;
  num+= occupied(x-1,y) ? 1: 0;
  num+= occupied(x+1,y) ? 1: 0;
  num+= occupied(x,y-1) ? 1: 0;
  num+= occupied(x,y+1) ? 1: 0;

  function occupied(x,y) {
    return grid[x] && grid[x][y];
  }
  //TODO This a hack, basically saying the more neighbors you have the more likely
  //you are to stay stuck.
  if(num && Math.random() < sticking_prob*num) {
    return num;
  } else {
    return 0;
  }
}

