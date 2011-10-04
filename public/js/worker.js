self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.cmd) {
    case 'start':
      self.postMessage('WORKER STARTED: ' + data.msg);
      break;
    case 'stop':
      self.postMessage('WORKER STOPPED: ' + data.msg + '. (buttons will no longer work)');
      self.close(); // Terminates the worker.
      break;
    case 'grid':
      var grid = data.grid
      var iter = 0;
      var coords = [];
      var edge = data.edge;
      var max_dist = 0;
      for(var i=0; i < data.num; i++) {
        var c = random_from_polar(edge, data.dim);
        var x = c.x; var y = c.y;
        while(coord_has_neighbor(grid, x, y)==0) {
          var p = Math.floor(Math.random()*4)
          switch(p) {
            case 0: x = x+1; break;
            case 1: x = x-1; break;
            case 2: y = y+1; break;
            case 3: y = y-1; break;
          }
          if(!valid_coords(grid,x,y) || too_far_away(x,y,edge, data.dim)) {
            c = random_from_polar(edge, data.dim);
            x = c.x;
            y = c.y;
          }
          iter+=1;
        }
        var dist = Math.sqrt((x-data.dim/2)*(x-data.dim/2)+(y-data.dim/2)*(y-data.dim/2));
        if((edge-dist)*(edge-dist) <= 100) {
          edge += 10;
        }
        if(dist > max_dist) {max_dist = dist};
        grid[x][y] += 1;
        coords.push({'x':x, 'y':y});
      }
      self.postMessage({'iter':iter, 'coords':coords, 'edge':edge, 'max_dist':max_dist}); break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
}, false);

function too_far_away(x, y, radius, dim) {
  x = x-dim/2;
  y = y-dim/2;
  r = Math.sqrt(x*x+y*y);
  return false; //(r-radius)*(r-radius) > 2500;
}
function random_from_polar(radius, dim) {
  var angle = Math.random()*2*Math.PI;
  //radius = Math.min(radius, dim/2);
  var x = Math.floor(radius*Math.cos(angle))+dim/2
  var y = Math.floor(radius*Math.sin(angle))+dim/2
  return {'x':x, 'y':y};
}
function valid_coords(grid, x, y) {
  return grid[x] && grid[x][y] !== undefined;
}
function coord_has_neighbor(grid, x, y) {
  var num=0;
  num+= occupied(x,y)   ? 1: 0;
  num+= occupied(x-1,y) ? 1: 0;
  num+= occupied(x+1,y) ? 1: 0;
  num+= occupied(x,y-1) ? 1: 0;
  num+= occupied(x,y+1) ? 1: 0;

  function occupied(x,y) {
    return grid[x] && grid[x][y];
  }
  return num;
}

