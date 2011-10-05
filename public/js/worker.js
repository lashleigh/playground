self.addEventListener('message', function(e) {
  var data = e.data;
  if(data.cmd == 'grid') { //switch (data.cmd) {
    var grid = data.grid
    var iter = 0;
    var coords = [];
    var edge = data.edge;
    var max_dist = 0;
    var walk_function = classic8_walk; //function() { if(data.grid_style==='hex') { return hex_walk;} else if(data.grid_style==="classic8") { return classic8_walk;} else { return classic_walk;};}
    for(var i=0; i < data.num; i++) {
      var c = random_from_polar(edge, data.radius);
      while(coord_has_neighbor(grid, c, data)==0) {
        c = walk_function(c);
        if(!valid_coords(grid,c) || too_far_away(c,edge, data.radius, true)) {
          c = random_from_polar(edge, data.radius);
        }
        iter+=1;
      }
      var dist = (c.x-data.radius)*(c.x-data.radius)+(c.y-data.radius)*(c.y-data.radius);
      if(dist > max_dist) {max_dist = dist; edge = Math.sqrt(dist)+25; }
      grid[c.x][c.y] += 1;
      coords.push(c);
    }
    self.postMessage({'iter':iter, 'coords':coords, 'edge':edge, 'max_dist':max_dist});
  };
}, false);

function too_far_away(c, radius, radius, delete_far) {
  if(delete_far) {
    var x = c.x-radius;
    var y = c.y-radius;
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
function valid_coords(grid, c) {
  return grid[c.x] && grid[c.x][c.y] !== undefined;
}
function coord_has_neighbor(grid, c, data) {
  var num=0;
  var x = c.x, y=c.y;
  num+= occupied(x,y)   ? 1: 0;
  num+= occupied(x-1,y) ? 1: 0;
  num+= occupied(x+1,y) ? 1: 0;
  num+= occupied(x,y-1) ? 1: 0;
  num+= occupied(x,y+1) ? 1: 0;
  if(data.grid_style=="hex") {
    num+= occupied(x-1,y+1) ? 1: 0;
    num+= occupied(x+1,y+1) ? 1: 0;
  }
  else if(data.grid_style=="classic8") {
    num+= occupied(x+1,y-1) ? 1: 0;
    num+= occupied(x+1,y+1) ? 1: 0;
    num+= occupied(x-1,y-1) ? 1: 0;
    num+= occupied(x-1,y+1) ? 1: 0;
  }

  function occupied(x,y) {
    return grid[x] && grid[x][y];
  }
  //TODO This a hack, basically saying the more neighbors you have the more likely
  //you are to stay stuck.
  if(data.sticking_prob) { 
    if(Math.random() < data.sticking_prob*num) {
      return num;
    } else {
      return 0;
    }
  } else {
    return num;
  }
}
function hex_walk(c) {
  var p = Math.floor(Math.random()*4)
  var x=c.x, y=c.y;
  switch(p) {
    case 0: x = x+1; break;
    case 1: x = x-1; break;
    case 2: y = y+1; break;
    case 3: y = y-1; break;
    //case 4: x = x-1; y = y+1; break;
    //case 5: x = x+1; y = y+1; break;
  }
  return {'x':x, 'y':y};
}
function classic_walk(c) {
  var x=c.x, y=c.y;
  var p = Math.floor(Math.random()*4)
  switch(p) {
    case 0: x = x+1; break;
    case 1: x = x-1; break;
    case 2: y = y+1; break;
    case 3: y = y-1; break;
  }
  return {'x':x, 'y':y};
}
function classic8_walk(c) {
  var x=c.x, y=c.y;
  var p = Math.floor(Math.random()*8)
  switch(p) {
    case 0: x = x+1; break;
    case 1: x = x-1; break;
    case 2: y = y+1; break;
    case 3: y = y-1; break;
    case 4: x = x+1; y = y+1; break;
    case 5: x = x+1; y = y-1; break;
    case 6: x = x-1; y = y+1; break;
    case 7: x = x-1; y = y-1; break;
  }
  return {'x':x, 'y':y};
}
