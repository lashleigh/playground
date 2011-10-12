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
    res = []
    var neighbors = this.Neighbors(p)
    for(var i=0; i < neighbors.length; i++) {
      res.push(neighbors[i].Search(p))
    }
    return _.flatten(res);
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
function Particle(x, y, w) {
  var w = w || 400;
  this.x = x || Math.random()*w;
  this.y = y || Math.random()*w;
  return this;
}

