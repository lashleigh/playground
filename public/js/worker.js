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
          if(!valid_coords(grid,x,y)) {
            c = random_from_polar(edge, data.dim);
            x = c.x;
            y = c.y;
          }
          iter+=1;
        }
        if(edge*edge - x*x+y*y < 10) {
          edge += 10;
        }
        grid[x][y] += 1;
        coords.push({'x':x, 'y':y});
      }
      self.postMessage({'iter':iter, 'coords':coords, 'edge':edge}); break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
}, false);

function random_from_polar(radius, dim) {
  var angle = Math.random()*2*Math.PI;
  radius = Math.min(radius, dim/2);
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
function left_edge(dim, edge) {
  return Math.max(dim/2-edge, 0);
}
function right_edge(dim, edge) {
  return Math.min(dim/2+edge, dim-1);
}
function random_coords(left, right) {
  var x, y;
  var p = Math.floor(Math.random()*4);
  switch(p) {
    case 0: x=left;  y= Math.floor(Math.random()*(right-left))+left; break;
    case 1: x=right; y= Math.floor(Math.random()*(right-left))+left; break;
    case 2: y=left;  x= Math.floor(Math.random()*(right-left))+left; break;
    case 3: y=right; x= Math.floor(Math.random()*(right-left))+left; break;
  }
  return {'x':x,'y':y};
}
