function MovementCtrl(viewer)	// Cesium.viewer
{
    // Private fields pre-defined
	var _viewer = viewer;		// cesium viewer
	var _flags = {				// Determine how user is moving
		looking : false,
		moveForward : false,
		moveBackward : false,
		moveUp : false,
		moveDown : false,
		moveLeft : false,
		moveRight : false
	};
	var _moveRate = 1;		// How fast is camera moving with key control
	
	// Private fields derived
	var _canvas = _viewer.canvas;
	var _handler = new Cesium.ScreenSpaceEventHandler(_canvas);
	var _ellipsoid = _viewer.scene.globe.ellipsoid;
	var _heading = _viewer.scene.camera.heading;
	var _pitch = _viewer.scene.camera.pitch;
	
	var _prevPosition = {
		orientation:{},
		duration: 2
	};	// Camera position and orientation before switching to human view
	
	// Public fields
	this.humanFlag = true;		// Whether it is human mode. If not, then it is bird eye mode
								// First set this to true and then toggle it in initiation construction,
								//		so default mode is bird eye mode
	
	/* 
	 * Private functions
	 */
	// Read flag according to user input key
	var _funcGetFlagForKeyCode = function(keyCode) {
		switch (keyCode) {
			case 'W'.charCodeAt(0):
				return 'moveForward';
			case 'S'.charCodeAt(0):
				return 'moveBackward';
			case 'Q'.charCodeAt(0):
				return 'moveUp';
			case 'E'.charCodeAt(0):
				return 'moveDown';
			case 'D'.charCodeAt(0):
				return 'moveRight';
			case 'A'.charCodeAt(0):
				return 'moveLeft';
			default:
				return undefined;
		}
	};
	
	// Change FOV
	var _funcChangeFOV = function(delta)
	{
		var min = 3*Math.PI/180, max = 111*Math.PI/180;
		newFOV = _viewer.camera.frustum.fov - delta*0.05*Math.PI/180;
		
		if(newFOV >= min && newFOV <= max)
			_viewer.camera.frustum.fov = newFOV;
	}
	
	// Proposed key up event function
	var _funcKeyUp = function(e) {
		var flagName = _funcGetFlagForKeyCode(e.keyCode);
		if (typeof flagName !== 'undefined') {
			_flags[flagName] = false;
		}
	};
	
	// Proposed key down event function
	var _funcKeyDown = function(e) {
		var flagName = _funcGetFlagForKeyCode(e.keyCode);
		if (typeof flagName !== 'undefined') {
			_flags[flagName] = true;
		}
	};
	
	// Proposed Cesium onTick for bird eye view
	var _funcBirdEyeTick = function() {
		var camera = _viewer.camera;

		// Change movement spered based on the distance of the camera to the surface of the ellipsoid.
		var cameraCarto = _ellipsoid.cartesianToCartographic(camera.position);
		var cameraHeight = cameraCarto.height;
		if(cameraHeight<0)
			cameraHeight=0;
			
		if($.isNumeric(cameraHeight))
			_moveRate = 0.1*Math.sqrt(cameraHeight) + 1;
		
		
		if (_flags.moveForward) {
			camera.moveForward(_moveRate);
		}
		if (_flags.moveBackward) {
			camera.moveBackward(_moveRate);
		}
		if (_flags.moveUp) {
			camera.moveUp(_moveRate);
		}
		if (_flags.moveDown) {
			camera.moveDown(_moveRate);
		}
		if (_flags.moveLeft) {
			camera.moveLeft(_moveRate);
		}
		if (_flags.moveRight) {
			camera.moveRight(_moveRate);
		}
	}
	
	// Proposed Cesium onTick for human view
	var _funcHumanTick = function() {
		var camera = _viewer.camera;

		// Change movement spered based on the distance of the camera to the surface of the ellipsoid.
		var cameraCarto = _ellipsoid.cartesianToCartographic(camera.position);
		var terrainHeight = Cesium.defaultValue(viewer.scene.globe.getHeight(new Cesium.Cartographic(cameraCarto.longitude, cameraCarto.latitude)), 0.0);
		cameraCarto.height = terrainHeight+1.8;
		_viewer.scene.camera.position = Cesium.Cartesian3.fromDegrees(cameraCarto.longitude*180/Math.PI, cameraCarto.latitude*180/Math.PI, cameraCarto.height);
		var moveRateHuman = 1;
		
		if (_flags.moveForward) {
			camera.moveForward(moveRateHuman);
		}
		if (_flags.moveBackward) {
			camera.moveBackward(moveRateHuman);
		}
		if (_flags.moveLeft) {
			camera.moveLeft(moveRateHuman);
		}
		if (_flags.moveRight) {
			camera.moveRight(moveRateHuman);
		}
	};
	
	/*
	 * Public functions
	 */
	MovementCtrl.prototype.toggle = function() {
		// if currently bird eye mode, to switch to human mode
		if(!this.humanFlag)
		{
			this.humanFlag = true;
			var cPos = _viewer.scene.camera.position;
			_prevPosition.destination = new Cesium.Cartesian3(cPos.x, cPos.y, cPos.z);
			_prevPosition.orientation.heading = _viewer.scene.camera.heading;
			_prevPosition.orientation.pitch = _viewer.scene.camera.pitch;
			_prevPosition.orientation.roll = 0;
			
			var cPosCarto = Cesium.Cartographic.fromCartesian(cPos);
			cPosCarto.height = 1.8+Cesium.defaultValue(viewer.scene.globe.getHeight(new Cesium.Cartographic(cPosCarto.longitude, cPosCarto.latitude)), 0.0);
			
			_viewer.scene.camera.flyTo({
				destination: Cesium.Cartesian3.fromDegrees(cPosCarto.longitude*180/Math.PI, cPosCarto.latitude*180/Math.PI, cPosCarto.height),
				orientation: {
					heading : _viewer.scene.camera.heading, // east, default value is 0.0 (north)
					pitch : -5*Math.PI/180,    // default value (looking down)
					roll : 0.0                             // default value
				},
				duration: 2
			});
			
			setTimeout(function() {
				_canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
				_canvas.onclick = function() {
					_canvas.focus();
				};
				
				_viewer.scene.screenSpaceCameraController.enableRotate = false;
				_viewer.scene.screenSpaceCameraController.enableTranslate = false;
				_viewer.scene.screenSpaceCameraController.enableZoom = false;
				_viewer.scene.screenSpaceCameraController.enableTilt = false;
				_viewer.scene.screenSpaceCameraController.enableLook = false;
				_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
				
				var startMousePosition;
				var mousePosition;

				_handler.setInputAction(function(movement) {
					_flags.looking = true;
					mousePosition = startMousePosition = Cesium.Cartesian3.clone(movement.position);
					
					mouseStartX = mousePosition.x;
					mouseStartY = mousePosition.y;
					
					_heading = _viewer.scene.camera.heading;
					_pitch = _viewer.scene.camera.pitch;
				}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

				_handler.setInputAction(function(movement) {
					mousePosition = movement.endPosition;
					if(_flags.looking)
					{
						var width = _canvas.clientWidth;
						var height = _canvas.clientHeight;

						var x = -(mousePosition.x - startMousePosition.x)*0.12 + _heading*180/Math.PI;
						var y = (mousePosition.y - startMousePosition.y)*0.12 + _pitch*180/Math.PI;
						var cp = _viewer.camera.position;
						
						y = Math.max( - 89, Math.min( 89, y ) );
						
						viewer.camera.setView({
							destination: cp,
							orientation: {
								heading : Cesium.Math.toRadians(x), // east, default value is 0.0 (north)
								pitch : Cesium.Math.toRadians(y),    // default value (looking down)
								roll : 0.0                             // default value
							}
						});
					}
				}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
				
				_handler.setInputAction(function(movement) {
					var min = 5*Math.PI/180, max = 111*Math.PI/180;	
					_funcChangeFOV(movement);
				}, Cesium.ScreenSpaceEventType.WHEEL);

				_handler.setInputAction(function(position) {
					_flags.looking = false;
					
					_heading = _viewer.scene.camera.heading;
					_pitch = _viewer.scene.camera.pitch;
				}, Cesium.ScreenSpaceEventType.LEFT_UP);
				
				_viewer.clock.onTick.removeEventListener(_funcBirdEyeTick);
				_viewer.clock.onTick.addEventListener(_funcHumanTick);
			},2000);
		}
		else	// if currently human mode, to switch to bird eye mode
		{
			this.humanFlag = false;
				
			_viewer.scene.screenSpaceCameraController.enableRotate = true;
			_viewer.scene.screenSpaceCameraController.enableTranslate = true;
			_viewer.scene.screenSpaceCameraController.enableZoom = true;
			_viewer.scene.screenSpaceCameraController.enableTilt = true;
			_viewer.scene.screenSpaceCameraController.enableLook = true;
			
			_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
			_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
			_handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
			_handler.removeInputAction(Cesium.ScreenSpaceEventType.WHEEL);
			
			_viewer.clock.onTick.removeEventListener(_funcHumanTick);
			_viewer.clock.onTick.addEventListener(_funcBirdEyeTick);
			
			if(_prevPosition.destination)
				_viewer.scene.camera.flyTo(_prevPosition);
		}
	}
	
	// Initialization after construction
	$(document).on('keydown',_funcKeyDown);
	$(document).on('keyup',_funcKeyUp);
	this.toggle();
}