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
  if(this.items && this.items.length > 4 && (this.x_max-this.x_min > 4*PARTICLE_RADIUS)) {
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
  if( p.x > (this.mid_x - PARTICLE_RADIUS) && p.y < (this.mid_y + PARTICLE_RADIUS)) { //: # North West
    quadrants.push(this.ne)
  }
  if( p.x < (this.mid_x + PARTICLE_RADIUS) && p.y < (this.mid_y + PARTICLE_RADIUS)) { //: # North East
    quadrants.push(this.nw)
  }
  if( p.x > (this.mid_x - PARTICLE_RADIUS) && p.y > (this.mid_y - PARTICLE_RADIUS)) { //: # South West
    quadrants.push(this.se)
  }
  if( p.x < (this.mid_x + PARTICLE_RADIUS) && p.y > (this.mid_y - PARTICLE_RADIUS)) { //: # South East
    quadrants.push(this.sw)
  }
  return quadrants
}
function Particle(x, y, w, offset) {
  w = w || 400;
  offset = offset || 0;
  this.x = x || Math.random()*w+offset;
  this.y = y || Math.random()*w+offset;
  this.angle;
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
    this.x -= (2*PARTICLE_RADIUS-min_p.dist)*Math.cos(this.angle)
    this.y -= (2*PARTICLE_RADIUS-min_p.dist)*Math.sin(this.angle)
    return true;
  } else {
    return false;
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
      var most_overlapping = _.min(filtered, function(p) {return p.dist});  
      var x1 = most_overlapping.p.x - that.x;
      var y1 = most_overlapping.p.y - that.y;
      var m = dx/dy; 
      var muv = (m*x1-y1)*(m*x1-y1);
      var ddmm = DIAMETER_SQUARED*(m*m+1);
      if(muv > ddmm) {
        // This would only happen if the particle were actually too far away.
        return {'stat':'destroy', 'p':that};
      } else {
        var x= ((1)*Math.sqrt(ddmm -muv) +m*y1 +x1)/(m*m+1)
        var xneg = ((-1)*Math.sqrt(ddmm -muv) +m*y1 +x1)/(m*m+1)
        if(m < 0) {
          x = xneg;
        }         
        var y = m*x;
        that.x += x;
        that.y += y;
       
        return {'stat':'neighbor', 'p':that};
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
  } else {
    return this;
  }
}
Particle.prototype.destroy = function() {
  delete this;
}

function overlapping(element, index, array) {
  return element.dist < DIAMETER_SQUARED-0.001; 
}
function distance_squared(a, b) {
  return (a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y)
}
function distance(a, b) {
  return Math.sqrt(distance_squared(a,b));
}
