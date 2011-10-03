      if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

			var container, stats;
			var camera, scene, renderer;
			var projector, plane;
      var mouse2D, mouse3D, ray,
			rollOveredFace, isShiftDown = false,
      theta = 45, isCtrlDown = false;
      var voxels = [];
      var grid = [];
      var intervalID;
      var plane_size = 1500;
      var voxel_dim = 75
      var grid_max = Math.floor(plane_size/voxel_dim); 
      plane_size = grid_max*voxel_dim;
      var half_plane = plane_size/2;

			init();
			animate();

      function pause() {
        clearInterval(intervalID);
      }
			function init() {

				container = document.createElement( 'div' );
				document.body.appendChild( container );

				var info = document.createElement( 'div' );
				info.style.position = 'absolute';
				info.style.top = '10px';
				info.style.width = '100%';
				info.style.textAlign = 'center';
				info.innerHTML = '<a href="http://github.com/mrdoob/three.js" target="_blank">three.js</a> - voxel painter<br /><strong>click</strong>: add voxel, <strong>control + click</strong>: remove voxel, <strong>shift + click</strong>: rotate, <a href="javascript:save();return false;">save .png</a>';
				container.appendChild( info );

				camera = new THREE.Camera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
				camera.position.y = 800;
				camera.target.position.y = -voxel_dim;

        scene = new THREE.Scene();
        
        // Draw several
        var FPS = 30;
        intervalID = setInterval(function() {
          new_voxel();
        }, 1000/FPS);
        
        // Grid
        for(var i=0; i < grid_max; i++) {
          grid[i] = [];
          for(var j=0; j < grid_max; j++) {
            grid[i][j] = [];
          }
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

				document.addEventListener( 'mousemove', onDocumentMouseMove, false );
				document.addEventListener( 'mousedown', onDocumentMouseDown, false );
				document.addEventListener( 'keydown', onDocumentKeyDown, false );
				document.addEventListener( 'keyup', onDocumentKeyUp, false );

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
          grid[voxel.grid.x][voxel.grid.y].push(voxel);
          if(coords[4]) {
            merge_clusters(voxel, coords[4]);
          }
          check_for_neighbors(voxel);
          scene.addObject( voxel );
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

        var color, cluster;
        var stack = grid[grid_x][grid_y];
        if(stack.length > 0) {
          var v = stack[stack.length-1];
          color = v.materials;
          cluster = v;
        }
        return [x, y, z, color, cluster || false];
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
        var z = voxel.grid.y;
        neigh = 0
        neigh += grid_has_element_at(x,   z, voxel);
        neigh += grid_has_element_at(x-1, z, voxel);
        neigh += grid_has_element_at(x+1, z, voxel);
        neigh += grid_has_element_at(x, z-1, voxel);
        neigh += grid_has_element_at(x, z+1, voxel);
        if(neigh == 0) {
          voxel.cluster.removeVoxel(voxel);
        }
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
        }
      }
      function grid_has_element_at(x, y, voxel) {
        if(grid[x] && grid[x][y] && grid[x][y].length) {
          merge_clusters(voxel, grid[x][y][0])
          return 1; 
        } else {
          return 0;
        }
      }

			function onDocumentMouseMove( event ) {

				event.preventDefault();

				mouse2D.x = ( event.clientX / window.innerWidth ) * 2 - 1;
				mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

			}

			function onDocumentMouseDown( event ) {
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

			function render() {
				if ( isShiftDown ) {
					theta += mouse2D.x * 3;
				}

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

				camera.position.x = 0; //1400 * Math.sin( theta * Math.PI / 360 );
        camera.position.z = 1900 * Math.cos( theta * Math.PI / 360 );
        camera.position.y = camera.position.z + 400;

				renderer.render( scene, camera );
			}
