function PanoView(divID)
{
	// Private fields pre-defined
	var _container = document.getElementById(divID);
	
	// Public fields
	this.scene = null;
	this.camera = null;
	this.background = null;
	this.renderer = null;
	
	/*
	 * Private functions
	 */
	// Init WebGL canvas
	var _init = function(thisObj) {
		var width = $('#cesiumContainer').width() || 1;
		var height = $('#cesiumContainer').height() || 1;
		var aspect = width / height;
		var devicePixelRatio = window.devicePixelRatio || 1;

		thisObj.renderer = new THREE.WebGLRenderer( { antialias: false } );
		thisObj.renderer.setPixelRatio( devicePixelRatio );
		thisObj.renderer.setSize( width, height );
		_container.appendChild( thisObj.renderer.domElement );
		
		thisObj.camera = new THREE.PerspectiveCamera( 65, aspect, 1, 10000 );
		thisObj.scene = new THREE.Scene();
		
		// Give light to the scene
		// To be added...
		
		thisObj.background = new THREE.EffectComposer( thisObj.renderer );
		
		var texturePass = new THREE.TexturePass();
		thisObj.background.addPass( texturePass );
		texturePass.enabled = true;

		var textureLoader = new THREE.TextureLoader();
		textureLoader.load( "assets/photos/IMG_0163.JPG", function( map ) {
			texturePass.map = map;
			thisObj.background.render();
		});
		
		renderPass = new THREE.RenderPass( thisObj.scene, thisObj.camera );
		renderPass.clear = false;
		thisObj.background.addPass( renderPass );

		copyPass = new THREE.ShaderPass( THREE.CopyShader );
		copyPass.renderToScreen = true;
		thisObj.background.addPass( copyPass );
		
		window.addEventListener( 'resize', _onWindowResize, false );
	}
	
	// Window resize event callback
	var _onWindowResize = function() {
		var width = $('#cesiumContainer').width() || 1;
		var height = $('#cesiumContainer').height() || 1;
		var aspect = width / height;

		threeDGIS.panoView.camera.aspect = aspect;
		threeDGIS.panoView.camera.updateProjectionMatrix();

		// cameraO.left = - height * aspect;
		// cameraO.right = height * aspect;
		// cameraO.top = height;
		// cameraO.bottom = - height;
		// cameraO.updateProjectionMatrix();

		threeDGIS.panoView.renderer.setSize( width, height );

		var pixelRatio = threeDGIS.panoView.renderer.getPixelRatio();
		var newWidth  = Math.floor( width / pixelRatio ) || 1;
		var newHeight = Math.floor( height / pixelRatio ) || 1;
		threeDGIS.panoView.background.setSize( newWidth, newHeight );
	}
	
	/*
	 * Public functions
	 */
	PanoView.prototype.changeBackground = function(img) {
		var passes = this.background.passes;
		var thisObj = this;
		for(var i=0; i<passes.length; i++)
		{
			if(passes[i] instanceof THREE.TexturePass)
			{
				var textureLoader = new THREE.TextureLoader();
				textureLoader.load(img.src, function( map ) {
					passes[i].map = map;
					thisObj.background.render();
				});
				break;
			}
		}
	}
	
	// Render animation on canvas
	var _animate = function(frame) {
		requestAnimationFrame( _animate );
		if(threeDGIS!=undefined)
		{
			threeDGIS.panoView.camera.updateMatrixWorld( true );
			var scene = threeDGIS.panoView.scene;
			var camera = threeDGIS.panoView.camera;

			var passes = threeDGIS.panoView.background.passes;
			for(var i=0; i<passes.length; i++)
			{
				if(passes[i] instanceof THREE.TexturePass)
				{
					passes[i].enabled = true;
					passes[i].opacity = 1;
				}
			}
			
			threeDGIS.panoView.background.render();
			// threeDGIS.panoView.renderer.render(scene, camera);
		}
	}
	
	// Implementation after initialization
	// Attach me to global window
	_init(this);
	_animate();
}