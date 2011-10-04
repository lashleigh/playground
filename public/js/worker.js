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
      for(var i=0; i < 20; i++) {
        var left = left_edge(data.dim, edge);
        var right = right_edge(data.dim, edge);
        var c = random_coords(left, right);
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
            c = random_coords(left, right);
            x = c.x;
            y = c.y;
          }
          iter+=1;
        }
        if((x-left <10)||(right-x <10)||(y-left <10)||(right-y <10)) {
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
