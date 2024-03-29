function QuadTree(parent_tree, x_min, x_max, y_min, y_max, items) {
  this.x_min = x_min;
  this.x_max = x_max;
  this.y_min = y_min;
  this.y_max = y_max;
  this.mid_x = (x_max + x_min)/2;
  this.mid_y = (y_max + y_min)/2;

  this.nw = null;  //= new QuadTree();
  this.sw = null;  //= new QuadTree();
  this.ne = null;  //= new QuadTree();
  this.se = null;  //= new QuadTree();
  this.items = items || [];
  this.parent_tree = parent_tree || null;

  return this;
}
QuadTree.prototype.IsLeaf = function() {
  return !!!this.nw;
}
QuadTree.prototype.Divide = function() {
  var that = this;    //parent x_min       x_max       y_min       y_max
  this.ne = new QuadTree(this, this.mid_x, this.x_max, this.y_min, this.mid_y)
  this.se = new QuadTree(this, this.mid_x, this.x_max, this.mid_y, this.y_max)
  this.nw = new QuadTree(this, this.x_min, this.mid_x, this.y_min, this.mid_y)
  this.sw = new QuadTree(this, this.x_min, this.mid_x, this.mid_y, this.y_max)
  for(var i=0; i < that.items.length; i++) {
    var ns = 'n';
    var ew = 'w';
    var p = that.items[i]
    if(p.x > that.mid_x) {
      ew = 'e'
    }
    if(p.y > that.mid_y) {
      ns = 's' 
    }
    that[ns+ew].items.push(p);
  }
  that.items = null;
}
QuadTree.prototype.Insert = function(p) {
  if(this.IsLeaf()) {
    this.items.push(p);
  } else {
    var ns = 'n';
    var ew = 'w';
    if(p.x > this.mid_x) {
      ew = 'e'
    }
    if(p.y > this.mid_y) {
      ns = 's' 
    }
    this[ns+ew].Insert(p);
  }
  this.DivisionParams();
}
QuadTree.prototype.DivisionParams = function() {
  if(this.items && this.items.length > 1 && (this.x_max-this.x_min > 3)) {
    this.Divide();
  }
}
QuadTree.prototype.Remove = function(p) {
  // TODO figure out if this is needed.
}
QuadTree.prototype.Search = function(p) {
  if(this.IsLeaf()) {
    return this.items;
  } else {
    var res = [];
    var neighbors = this.Neighbors(p)
    for(var i=0; i < neighbors.length; i++) {
      res.push(neighbors[i].Search(p))
    }
    return _.flatten(res);
  }
}
QuadTree.prototype.LeafLevelNeighbors = function(p) {
  if(this.IsLeaf()) {
    return this;
  } else {
    var res = [];
    var neighbors = this.Neighbors(p)
    for(var i=0; i < neighbors.length; i++) {
      res.push(neighbors[i].LeafLevelNeighbors(p))
    }
    return _.flatten(res); //_.flatten(res);
  }
}
QuadTree.prototype.Neighbors = function(p) {
  quadrants = [];
  if( p.x > (this.mid_x - PARTICLE_DIAMETER) && p.y < (this.mid_y + PARTICLE_DIAMETER)) { //: # North West
    quadrants.push(this.ne)
  }
  if( p.x < (this.mid_x + PARTICLE_DIAMETER) && p.y < (this.mid_y + PARTICLE_DIAMETER)) { //: # North East
    quadrants.push(this.nw)
  }
  if( p.x > (this.mid_x - PARTICLE_DIAMETER) && p.y > (this.mid_y - PARTICLE_DIAMETER)) { //: # South West
    quadrants.push(this.se)
  }
  if( p.x < (this.mid_x + PARTICLE_DIAMETER) && p.y > (this.mid_y - PARTICLE_DIAMETER)) { //: # South East
    quadrants.push(this.sw)
  }
  return quadrants
}
function Particle(x, y) {
  this.angle = Math.random()*2*Math.PI
  this.x = x || drop_radius*Math.cos(this.angle)+RADIUS;
  this.y = y || drop_radius*Math.sin(this.angle)+RADIUS;
  this.created_at = (new Date()).valueOf();
  return this;
}
Particle.prototype.walk = function(STEP_SIZE, max) {
  this.angle = Math.random()*2*Math.PI;
  this.x += STEP_SIZE*Math.sin(this.angle);
  this.y += STEP_SIZE*Math.cos(this.angle);
  if(this.x < 0 || this.y < 0 || this.x > max || this.y > max) {
    this.destroy();
    return false;
  } else {
    return this;
  }
}
Particle.prototype.has_neighbors = function(trunk) {
  var that = this;
  var distances = _.map(trunk.Search(this), function(b) {return {'p':b, 'dist': distance_squared(that, b)}});
  var filtered = _.select(distances, overlapping);
  if(filtered.length) {
    var min_p = _.min(filtered, function(p) {return p.dist});
    min_p.dist = Math.sqrt(min_p.dist);
    this.x -= (PARTICLE_DIAMETER-min_p.dist)*Math.cos(this.angle)
    this.y -= (PARTICLE_DIAMETER-min_p.dist)*Math.sin(this.angle)
    return true;
  } else {
    return false;
  }
}
Particle.prototype.vector_walk = function(step, max, trunk) {
  var that = this;
  that.angle = Math.random()*2*Math.PI;
  var nx = Math.cos(that.angle);
  var ny = Math.sin(that.angle);
  var dx = step*nx;
  var dy = step*ny;
  if(that.inside_bounds(dx, dy, max)) {
    var within_box = _.select(trunk.Search({'x':that.x, 'y':that.y}), function(p) {return (Math.abs(p.x-that.x) < step+PARTICLE_DIAMETER && Math.abs(p.y-that.y) < step+PARTICLE_DIAMETER)});
    var with_dots = _.map(within_box, function(p) { return dot_and_dist(p)}); 
    var collides_with = _.select(with_dots, function(res) {return !!res.step_size}); // && (res.dist_squared >= DIAMETER_SQUARED-0.01 && res.distance_squared <= DIAMETER_SQUARED + 0.01) })
    if(collides_with.length > 0) {
      var first = _.min(collides_with, function(res) {return res.step_size})
      var x = that.x+first.step_size*nx
      var y = that.y+first.step_size*ny
      var dist_squared = distance_squared(first.p, {'x':x, 'y':y})
      if(dist_squared > DIAMETER_SQUARED - 0.01 && dist_squared < DIAMETER_SQUARED + 0.01) {
        that.x = x; 
        that.y = y; 
        return {'stat':'neighbor', 'p':that, 'dist': distance(that, {'x':RADIUS, 'y':RADIUS})};
      } else {
        that.x += dx;
        that.y += dy;
        return {'stat':'walk', 'p':that};
      }
    } else {
      that.x += dx;
      that.y += dy;
      return {'stat':'walk', 'p':that};
    }
  } else {
    return {'stat':'destroy', 'p':that};
  }

  function dot_and_dist(p) {
    var res = {};
    var cx = (p.x-that.x);
    var cy = (p.y-that.y);
    res['p'] = p;
    res['dot'] = cx*nx+cy*ny;
    if(res['dot'] > 0) {
      res['perpendicular_dist_squared'] = (cx*cx+cy*cy)-res['dot']*res['dot'];
      if(res['perpendicular_dist_squared'] > 0 && res['perpendicular_dist_squared'] < DIAMETER_SQUARED) {
        res['step_size'] = res['dot'] - Math.sqrt(DIAMETER_SQUARED - res['perpendicular_dist_squared']) 
      }
    }
    return res;
  }
}
Particle.prototype.predictive_walk = function(step, max, trunk) {
  var that = this;
  that.angle = Math.random()*2*Math.PI;
  while(that.angle % (Math.PI/2) === 0) {
    that.angle = Math.random()*2*Math.PI;
  }
  var dx = step*Math.cos(that.angle);
  var dy = step*Math.sin(that.angle);
  if(that.inside_bounds(dx, dy, max)) {
    var near = trunk.Search({'x':that.x+dx, 'y':that.y+dy});
    var distances = _.map(near, function(p) {return {'p':p, 'dist':distance_squared({'x':that.x+dx, 'y':that.y+dy}, p)}})
    var filtered = _.select(distances, overlapping);
    if(filtered.length) {
     //console.log(filtered)
    //var most_overlapping = _.min(filtered, function(p) {return p.dist});  
      var most_overlapping = _.min(filtered, function(p) { return distance_squared(p.p, that)})
      var x1 = most_overlapping.p.x - that.x;
      var y1 = most_overlapping.p.y - that.y;
      var m = dx/dy; 
      var muv = (m*x1-y1)*(m*x1-y1);
      var ddmm = DIAMETER_SQUARED*(m*m+1);
      if(muv > ddmm) {
        // This would only happen if the particle were actually too far away.
        return {'stat':'destroy', 'p':that};
      } else {
        var P1x= (Math.sqrt(ddmm -muv) +m*y1 +x1)/(m*m+1)
        var P1y= m*P1x;
        var P2x= ((-1)*Math.sqrt(ddmm -muv) +m*y1 +x1)/(m*m+1)
        var P2y= m*P2x;
        var dist1 = distance({'x':that.x+P1x, 'y':that.y+P1y}, that)
        var dist2 = distance({'x':that.x+P2x, 'y':that.y+P2y}, that) 
        if( dist2 < dist1) {
          that.x += P2x;
          that.y += P2y;
        } else {
          that.x += P1x;
          that.y += P1y;
        }
        //var should_be_2r = distance(that, most_overlapping.p);
        //console.log(should_be_2r, 'dist1', dist1, 'dist2', dist2)
       
        return {'stat':'neighbor', 'p':that, 'dist':distance(that, {'x':RADIUS, 'y':RADIUS})};
      }
    } else {
      that.x += dx;
      that.y += dy;

      return {'stat':'walk', 'p':that};
    }
  } else {
    return {'stat':'destroy', 'p':that};
  }
}
Particle.prototype.inside_bounds = function(dx, dy, max) {
  if(this.x+dx < 0 || this.y+dy < 0 || this.x+dx > max || this.y+dy > max) {
    return false;
  } else if(distance(this, {'x':RADIUS, 'y':RADIUS}) > drop_radius+20*PARTICLE_RADIUS) {
    this.destroy();
    return false;
  } else {
    return this;
  }
}
Particle.prototype.destroy = function() {
  delete this;
}

function overlapping(element, index, array) {
  return element.dist < DIAMETER_SQUARED; 
}
function distance_squared(a, b) {
  return (a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y)
}
function distance(a, b) {
  return Math.sqrt(distance_squared(a,b));
}
