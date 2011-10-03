var container, stats;
var camera, scene, renderer;
var projector, plane;
var mouse2D, mouse3D, ray,
rollOveredFace, isShiftDown = false,
theta = 45, isCtrlDown = false;
var isMouseDown,onMouseDownPosition, onMouseDownTheta = 45, onMouseDownPhi =60, phi = 60, radious = 2000;

var grid = [];
var intervalID;
var plane_size = 1500, voxel_dim = 75, grid_max = Math.floor(plane_size/voxel_dim); 
plane_size = grid_max*voxel_dim;
var half_plane = plane_size/2;
var simulation;
var one_neighbor = {}
var free_voxel = {}
var clusters = {}

window.onload = function() {
  if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

  simulation = new init();
  load_data_gui(simulation);
  //init()
  //animate();
}
function load_data_gui(sim) {
  var gui = new DAT.GUI();
  gui.add(sim, 'play'); // Specify a custom name.
  gui.add(sim, 'pause'); // Specify a custom name.
  gui.add(sim, 'clear');
}
function init() {
  var that = this;
  this.intervalID;
  this.pause = function() {clearInterval(this.intervalID)};
  this.play = playSimulation;
  this.FPS = 10;
  this.rotation_func = be_still;
  this.clear = reset_simulation;
  create_grid();

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.Camera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
    camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
    camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
  camera.target.position.y = -200;

  scene = new THREE.Scene();
  
  function playSimulation() {
    clearInterval(that.intervalID);
    that.intervalID = setInterval(function() {
      new_voxel();
    }, 1000/that.FPS);
  }
 
	var geometry = new THREE.Geometry();
	geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( - half_plane, 0, 0 ) ) );
	geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( half_plane, 0, 0 ) ) );

	var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );

	for ( var i = 0; i <= grid_max; i ++ ) {

		var line = new THREE.Line( geometry, material );
		line.position.z = ( i * voxel_dim ) - half_plane;
		scene.addObject( line );

		var line = new THREE.Line( geometry, material );
		line.position.x = ( i * voxel_dim ) - half_plane;
		line.rotation.y = 90 * Math.PI / 180;
		scene.addObject( line );

	}

	projector = new THREE.Projector();

	plane = new THREE.Mesh( new THREE.PlaneGeometry( plane_size, plane_size, grid_max, grid_max ), new THREE.MeshFaceMaterial() );
	plane.rotation.x = - 90 * Math.PI / 180;
	scene.addObject( plane );

	mouse2D = new THREE.Vector3( 0, 10000, 0.5 );
	ray = new THREE.Ray( camera.position, null );

	// Lights

	var ambientLight = new THREE.AmbientLight( 0x606060 );
	scene.addLight( ambientLight );

	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.x = Math.random() - 0.5;
	directionalLight.position.y = Math.random() - 0.5;
	directionalLight.position.z = Math.random() - 0.5;
	directionalLight.position.normalize();
	scene.addLight( directionalLight );

	var directionalLight = new THREE.DirectionalLight( 0x808080 );
	directionalLight.position.x = Math.random() - 0.5;
	directionalLight.position.y = Math.random() - 0.5;
	directionalLight.position.z = Math.random() - 0.5;
	directionalLight.position.normalize();
	scene.addLight( directionalLight );

	renderer = new THREE.CanvasRenderer();
	//renderer = new THREE.WebGLRenderer( { antialias: true } );
	//renderer = new THREE.SVGRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.appendChild(renderer.domElement);

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

  // Mouse events 
	document.addEventListener( 'keydown', onDocumentKeyDown, false );
	document.addEventListener( 'keyup', onDocumentKeyUp, false );
  
  onMouseDownPosition = new THREE.Vector2();

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );

}
function new_voxel(position) {
  coords = position ? to_coords(position) : new_random_coords();
  var material = coords[3] || [ new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff, opacity: 0.8, shading: THREE.FlatShading } ), new THREE.MeshFaceMaterial() ];
  if(coords) {
    var voxel = new THREE.Mesh( new THREE.CubeGeometry( voxel_dim, voxel_dim, voxel_dim ), material)
		voxel.position.x = coords[0];
		voxel.position.y = coords[1];
		voxel.position.z = coords[2];
		voxel.matrixAutoUpdate = false;
		voxel.updateMatrix();
    voxel.overdraw = true;
    voxel.grid = {};
    voxel.grid.x = Math.floor((voxel.position.x+half_plane - voxel_dim/2)/voxel_dim);
    voxel.grid.y = Math.floor((voxel.position.z+half_plane - voxel_dim/2)/voxel_dim);
    voxel.grid.z = (voxel.position.y-voxel_dim/2)/voxel_dim;
    if(coords[4]) {
      merge_clusters(voxel, coords[4]);
    }
    check_for_neighbors(voxel);
    grid[voxel.grid.x][voxel.grid.y].push(voxel); // Assigning to the grid last means the voxel doesn't match itself in check_for_neighbors
    scene.addObject( voxel );
    //render();
  }
}
function new_random_coords() {
  var grid_x = Math.floor(Math.random()*grid_max) // - grid_max/2) * voxel_dim + voxel_dim/2;
  var grid_y = Math.floor(Math.random()*grid_max) // - grid_max/2) * voxel_dim + voxel_dim/2;
  var x = grid_x*voxel_dim - half_plane + voxel_dim/2 
  var z = grid_y*voxel_dim - half_plane + voxel_dim/2 
  var height, color, cluster;
  var stack = grid[grid_x][grid_y];
  if(stack.length > 0) {
    var v = stack[stack.length-1];
    height = v.position.y + voxel_dim;
    color = v.materials;
    cluster = v;
  }
  return [x, height || voxel_dim/2, z, color, cluster || false];
}
function to_coords(pos) {
  var x = Math.floor( pos.x / voxel_dim ) * voxel_dim + voxel_dim/2;
  var y = Math.floor( pos.y / voxel_dim ) * voxel_dim + voxel_dim/2;
  var z = Math.floor( pos.z / voxel_dim ) * voxel_dim + voxel_dim/2;
  var grid_x = (x-voxel_dim/2 + half_plane)/voxel_dim
  var grid_y = (z-voxel_dim/2 + half_plane)/voxel_dim 

  var color, height, cluster;
  var stack = get_stack(grid_x,grid_y);
  if(stack) {
    if(stack.length > 0) {
      var v = stack[stack.length-1];
      height = v.position.y + voxel_dim;
      color = v.materials;
      cluster = v;
    }
    return [x, height || voxel_dim/2, z, color, cluster || false];
  } else {
    return false;
  }
  //return [x, y, z, color, cluster || false]; // This allows voxels to be above the surface level
}
function get_stack(x, y) {
  if(grid[x] && grid[x][y]) {
    return grid[x][y]
  } else {
    return false;
  }
}
function Cluster() {
  this.color = new THREE.Color( Math.random()*0xffffff );
  this.voxels = [];
  this.num_voxels = 0;
}
Cluster.prototype = {
  addVoxel: function(v) {this.voxels.push(v); this.num_voxels +=1; v.cluster = this; v.materials[0].color = this.color; }, 
  removeVoxel: function(v) {}
}
Cluster.prototype.merge = function(other) {
  if(this !== other) {
    for(var i=0; i < other.voxels.length; i++) { //key in other.voxels) {
      this.addVoxel(other.voxels[i]);
    }
  delete other;
  //delete active_clusters[other.id];
  }
}
function check_for_neighbors(voxel) {
  var x = voxel.grid.x;
  var y = voxel.grid.y;
  var z = voxel.grid.z;
  neigh = 0
  neigh += grid_has_element_at(x, y, z-1, voxel);
  neigh += grid_has_element_at(x-1, y, z, voxel);
  neigh += grid_has_element_at(x+1, y, z, voxel);
  neigh += grid_has_element_at(x, y-1, z, voxel);
  neigh += grid_has_element_at(x, y+1, z, voxel);
  if(neigh == 0) {
    if(voxel.cluster) {
      voxel.cluster.removeVoxel(voxel);
    }
    free_voxel[voxel.id] = voxel;
    delete one_neighbor[voxel.id];
  } else if(neigh == 1) {
    one_neighbor[voxel.id] = voxel;
    delete free_voxel[voxel.id];
  } else {
    delete free_voxel[voxel.id]
    delete one_neighbor[voxel.id]
  }
}
function num_neighbors(x, y, z) {
  var num = 0;
  num += grid[x] && grid[x][y] && grid[x][y][z-1] ? 1 : 0 
  num += grid[x] && grid[x][y] && grid[x][y][z+1] ? 1 : 0 
  x = x-1;
  num += grid[x] && grid[x][y] && grid[x][y][z] ? 1 : 0 
  x = x+2;
  num += grid[x] && grid[x][y] && grid[x][y][z] ? 1 : 0 
  x = x-1;
  y = y-1;
  num += grid[x] && grid[x][y] && grid[x][y][z] ? 1 : 0 
  y = y+2
  num += grid[x] && grid[x][y] && grid[x][y][z] ? 1 : 0 
  return num;
}
function get_neighbors_of(x, y, z) {
  var num = [];
  if(z==0) {
    num.push("bounds")
  } else {
    valid_coords(x,y,z-1) ? num.push(grid[x][y][z-1]) : num.push("bounds");
  }
  valid_coords(x,y,z+1) ? num.push(grid[x][y][z+1]) : num.push("bounds");
  valid_coords(x-1,y) ? num.push(grid[x-1][y][z]) : num.push("bounds");
  valid_coords(x+1,y) ? num.push(grid[x+1][y][z]) : num.push("bounds");
  valid_coords(x,y-1) ? num.push(grid[x][y-1][z]) : num.push("bounds");
  valid_coords(x,y+1) ? num.push(grid[x][y+1][z]) : num.push("bounds");
  return num;
}
function all_six_neighbors(x, y, z) {
  var num = [];
  grid[x] && grid[x][y] && grid[x][y][z-1] ? num.push(grid[x][y][z-1]) : num.push(false);
  grid[x] && grid[x][y] && grid[x][y][z+1] ? num.push(grid[x][y][z+1]) : num.push(false);
  x = x-1;
  grid[x] && grid[x][y] && grid[x][y][z] ? num.push(grid[x][y][z]) : num.push(false);
  x = x+2;
  grid[x] && grid[x][y] && grid[x][y][z] ? num.push(grid[x][y][z]) : num.push(false);
  x = x-1;
  y = y-1;
  grid[x] && grid[x][y] && grid[x][y][z] ? num.push(grid[x][y][z]) : num.push(false);
  y = y+2
  grid[x] && grid[x][y] && grid[x][y][z] ? num.push(grid[x][y][z]) : num.push(false);
  return num;
}
function valid_coords(x,y,z) {
  //return grid[x] && grid[x][y] && z >= 0 //TODO check for upper z-bounds?
  return grid[x] && grid[x][y];
}
function merge_clusters(v1, v2) {
  if(v1.cluster && v2.cluster) {
    if(v1.cluster.num_voxels > v2.cluster.num_voxels) {
      v1.cluster.merge(v2.cluster);
    } else {
      v2.cluster.merge(v1.cluster);
    }
  } else if( v1.cluster) {
    v1.cluster.addVoxel(v2);
  } else if( v2.cluster) {
    v2.cluster.addVoxel(v1);
  } else {
    c = new Cluster();
    c.addVoxel(v1);
    c.addVoxel(v2);
    //one_neighbor[v1.id] = v1; This should have just gotten set
    one_neighbor[v2.id] = v2
  }
  delete free_voxel[v1.id]
  delete free_voxel[v2.id]
}
function grid_has_element_at(x, y, z, voxel) {
  if(grid[x] && grid[x][y] && grid[x][y][z]) {
    merge_clusters(voxel, grid[x][y][0])
    return 1; 
  } else {
    return 0;
  }
}

function onDocumentMouseMove_OLD( event ) {
	event.preventDefault();
	mouse2D.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onDocumentMouseDown( event ) {
    event.preventDefault();
    isMouseDown = true;
    onMouseDownTheta = theta;
    onMouseDownPhi = phi;
    onMouseDownPosition.x = event.clientX;
    onMouseDownPosition.y = event.clientY;
}
function onDocumentMouseMove( event ) {
  event.preventDefault();
  if ( isMouseDown ) {
      theta = - ( ( event.clientX - onMouseDownPosition.x ) * 0.5 ) + onMouseDownTheta;
      phi = ( ( event.clientY - onMouseDownPosition.y ) * 0.5 ) + onMouseDownPhi;

      phi = Math.min( 180, Math.max( 0, phi ) );

      camera.position.x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
      camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
      camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
      camera.updateMatrix();
  }
  mouse3D = projector.unprojectVector( new THREE.Vector3( ( event.clientX / renderer.domElement.width ) * 2 - 1, - ( event.clientY / renderer.domElement.height ) * 2 + 1, 0.5 ), camera );
  ray.direction = mouse3D.subSelf( camera.position ).normalize();

	mouse2D.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  
  interact();
  render();
}
function onDocumentMouseDown_OLD( event ) {
	event.preventDefault();
	var intersects = ray.intersectScene( scene );

	if(intersects.length > 0) {
		if(isCtrlDown) {
			if(intersects[ 0 ].object != plane ) {
				scene.removeObject( intersects[ 0 ].object );
			}
		} else {
      var position = new THREE.Vector3().add( intersects[ 0 ].point, intersects[ 0 ].object.matrixRotationWorld.multiplyVector3( intersects[ 0 ].face.normal.clone() ) );
      new_voxel(position)
		}
	}
}
function onDocumentMouseUp( event ) {
  event.preventDefault();
  isMouseDown = false;
  onMouseDownPosition.x = event.clientX - onMouseDownPosition.x;
  onMouseDownPosition.y = event.clientY - onMouseDownPosition.y;

  if ( onMouseDownPosition.length() > 5 ) {
      return;
  }
  var intersect, intersects = ray.intersectScene( scene );

  if ( intersects.length > 0 ) {
    intersect = intersects[ 0 ]; //.object == brush ? intersects[ 1 ] : intersects[ 0 ];
    if ( intersect ) {
      if ( isShiftDown ) {
        if ( intersect.object != plane ) {
           scene.removeObject( intersect.object );
        }
      } else {
        var position = new THREE.Vector3().add( intersects[ 0 ].point, intersects[ 0 ].object.matrixRotationWorld.multiplyVector3( intersects[ 0 ].face.normal.clone() ) );
        //var position = new THREE.Vector3().add( intersect.point, intersect.object.matrixRotation.transform( intersect.face.normal.clone() ) );
        new_voxel(position);
      }
    }
  }
  interact();
  render();
}

function onDocumentKeyDown( event ) {
	switch( event.keyCode ) {
		case 16: isShiftDown = true; break;
		case 17: isCtrlDown = true; break;
	}
}

function onDocumentKeyUp( event ) {
	switch( event.keyCode ) {
		case 16: isShiftDown = false; break;
		case 17: isCtrlDown = false; break;
	}
}

function save() {
	window.open( renderer.domElement.toDataURL('image/png'), 'mywindow' );
}

//

function animate() {
	requestAnimationFrame( animate );
	render();
	stats.update();
}
function interact() {
	mouse3D = projector.unprojectVector( mouse2D.clone(), camera );
	ray.direction = mouse3D.subSelf( camera.position ).normalize();

	var intersects = ray.intersectScene( scene );

	if ( intersects.length > 0 ) {
		if ( intersects[ 0 ].face != rollOveredFace ) {
			if ( rollOveredFace ) rollOveredFace.materials = [];
			rollOveredFace = intersects[ 0 ].face;
			rollOveredFace.materials = [ new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5 } ) ];
		}
	} else if ( rollOveredFace ) {
		 rollOveredFace.materials = [];
		 rollOveredFace = null;
	}
}
function render() {
	renderer.render( scene, camera );
}
function render_OLD() {
	//if ( isShiftDown ) {
	//	theta += mouse2D.x * 3;
	//}

	mouse3D = projector.unprojectVector( mouse2D.clone(), camera );
	ray.direction = mouse3D.subSelf( camera.position ).normalize();

	var intersects = ray.intersectScene( scene );

	if ( intersects.length > 0 ) {
		if ( intersects[ 0 ].face != rollOveredFace ) {
			if ( rollOveredFace ) rollOveredFace.materials = [];
			rollOveredFace = intersects[ 0 ].face;
			rollOveredFace.materials = [ new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5 } ) ];
		}
	} else if ( rollOveredFace ) {
		 rollOveredFace.materials = [];
		 rollOveredFace = null;
	}
  simulation.rotation_func();
	//camera.position.x = 0; //1400 * Math.sin( theta * Math.PI / 360 );
  //camera.position.z = 1900 * Math.cos( theta * Math.PI / 360 );

	renderer.render( scene, camera );
}  
function be_still() {
}
function rotate() {
  theta += 0.2;
  camera.position.x = plane_size * Math.sin( theta * Math.PI / 360 );
  //camera.position.y = plane_size * Math.sin( theta * Math.PI / 360 );
  camera.position.z = plane_size * Math.cos( theta * Math.PI / 360 ); 
}
function no_x() {
  theta += 0.2;
  //camera.position.x = plane_size * Math.sin( theta * Math.PI / 360 );
  camera.position.y = plane_size * Math.sin( theta * Math.PI / 360 );
  camera.position.z = plane_size * Math.cos( theta * Math.PI / 360 ); 
}
function lots_of_voxels() {
  var i = 0;
  while(i < 1000) {
    new_voxel();
    i++;
    if(i % 10 == 0) { render()};
  }
}
function num_voxels() {
  var num=0;
  for(var i=0; i< grid_max; i++) {
    for(var j=0; j < grid_max; j++) {
      num += grid[i][j].length;
    }
  }
  return num;
}
function reset_simulation() {
  var num_other = (grid_max+1)*2 +1; //The lines and mesh of the plane
  var v = scene.objects.splice(num_other, scene.objects.length-num_other)

  for(var i=0; i< v.length; i++) {
    scene.removeObject(v[i]);
    delete v[i];
  }
  free_voxel = {};
  one_neighbor = {};
  grid = []; create_grid();
  
  render();
}
function create_grid() {
  for(var i=0; i < grid_max; i++) {
    grid[i] = [];
    for(var j=0; j < grid_max; j++) {
      grid[i][j] = [];
    }
  }
}
