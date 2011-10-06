self.addEventListener('message', function(e) {
  var data = e.data;
  if(data.cmd == 'grid') { //switch (data.cmd) {
    var grid = data.grid
    var iter = 0;
    var coords = [];
    var edge = data.edge;
    var max_dist = 0;
    var walk_function, neigh_func;
    if(data.grid_style==='hex') { 
      walk_function = hex_walk;
      neigh_func = has_neighbor_hex;
    } else if(data.grid_style==="classic8") { 
      walk_function = classic8_walk;
      neigh_func = has_neighbor_8;
    } else { 
      walk_function = classic_walk;
      neigh_func = has_neighbor;
    }
    for(var i=0; i < data.num; i++) {
      var c = random_classic(edge, data.radius);
      while(neighbors(grid, c, data, neigh_func)==0) {
        c = walk_function(c);
        if(!valid_coords(grid,c) || too_far_away(c,edge, data.radius, true)) {
          c = random_classic(edge, data.radius);
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
function random_classic(r, radius) {
  var angle = Math.random()*2*Math.PI;
  var x = Math.floor(r*Math.cos(angle))+radius
  var y = Math.floor(r*Math.sin(angle))+radius
  return {'x':x, 'y':y};
}
function valid_coords(grid, c) {
  return grid[c.x] && grid[c.x][c.y] !== undefined;
}
function occupied(grid,x,y) {
  return grid[x] && grid[x][y];
}
function has_neighbor(grid, c, data) {
  var num=0;
  var x = c.x, y=c.y;
  num+= occupied(grid,x,y)   ? 1: 0;
  num+= occupied(grid,x-1,y) ? 1: 0;
  num+= occupied(grid,x+1,y) ? 1: 0;
  num+= occupied(grid,x,y-1) ? 1: 0;
  num+= occupied(grid,x,y+1) ? 1: 0;

  return num;
}
function has_neighbor_hex(grid, c, data) {
  var num = has_neighbor(grid, c, data)
  var x = c.x, y=c.y;
  if(x%2==0) {
    num+= occupied(grid,x+1, y-1)
    num+= occupied(grid,x-1, y-1)
  } else {      
    num+= occupied(grid,x-1, y+1)
    num+= occupied(grid,x+1, y+1)
  }
  return num;
}
function has_neighbor_8(grid, c, data) {
  var num = has_neighbor(grid, c, data)
  var x = c.x, y=c.y;
  num+= occupied(grid,x+1,y-1) ? 1: 0;
  num+= occupied(grid,x+1,y+1) ? 1: 0;
  num+= occupied(grid,x-1,y-1) ? 1: 0;
  num+= occupied(grid,x-1,y+1) ? 1: 0;
  return num;
}                
function neighbors(grid, c, data, neigh_func) {
  var num = neigh_func(grid, c, data);
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

// Hexagonal stuff below here
function random_hex(drop_r, max_r) {
  var z = Math.floor(Math.random()*drop_r*2)-drop_r
  var x = Math.floor(Math.random()*drop_r*2)-drop_r
  if(z > 0) {
    x = Math.abs(x)*(-1);
    y = drop_r+x
  } else {
    x = Math.abs(x);
    y = drop_r-x
  }
  return [x,y,z]
  //var corner = Math.floor(Math.random()*6)
  //var res = multiply(hex_identity[corner], drop_r)
  //return {'x':res[0], 'y':res[1], 'z':res[2]};
}
function hex_walk(c) {
  var x=c.x, y=c.y;
  var p = Math.floor(Math.random()*6)
  switch(p) {
    case 0: x = x+1; break;
    case 1: x = x-1; break;
    case 2: y = y+1; break;
    case 3: y = y-1; break;
    case 4: if(x%2==0) {x = x+1; y = y-1; } else {x = x-1; y = y+1;} break;
    case 5: if(x%2==0) {x = x-1; y = y-1; } else {x = x+1; y = y+1;} break;
  }
  return {'x':x, 'y':y};
}
// Ordered counter clockwise from
// http://stackoverflow.com/questions/2049196/generating-triangular-hexagonal-coordinates-xyz
var hex_identity = [
                    [ 1,-1, 0],
                    [ 0,-1, 1],
                    [-1, 0, 1],
                    [-1, 1, 0],
                    [ 0, 1,-1],
                    [ 1, 0,-1]
                    ]
function multiply(ary, num) {
  var res = []
  for(var i=0; i< ary.length; i++) {
    res[i] = ary[i]*num;
  }
  return res;
}
function sum_array(ary1, ary2) {
  var res = []
  for(var i=0; i< ary1.length; i++) {
    res[i] = ary1[i]+ary2[i]; 
  }
  return res;
}
function all_neighbors_hex(v) {
  var neigh = []
  for(var i=0; i< 6; i++) {
  neigh.push(sum_array(v, hex_identity[i]));
  console.log(sum_array(v, hex_identity[i]))
  }
  return neigh;
}
function random_corner(r, v) {
  var n = Math.floor(Math.random()*6); 
  var c = sum_array(multiply(hex_identity[n], r), v); 

  var p = Math.floor(Math.random()*2*(r-1)) - (r-1);
  console.log({'p':p, 'n':n, 'c':c})
  if(p==0) {
    return c;
  } else if(p>0) {
    var id = (n + 2) % 6;
    return sum_array(c, multiply(hex_identity[id], p))
  } else {
    p = Math.abs(p);
    var id = (n + 4) % 6;
    return sum_array(c, multiply(hex_identity[id], p))
  }
}

