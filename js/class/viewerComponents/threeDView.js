function ThreeDView(viewer, mapDiv, toolDiv)
{
	// Private fields pre-defined
	var _movementCtrl;
	
	/*
	 * Private fields to be computed
	 */
	// Handlers
	var _handler;				// Handler for mouse click and key click
	var _handlerDis;			// Distance measurement handler
	var _handlerHeight;			// Distance measurement for vertical/horizontal handler
	var _viewshedHandler;		// Viewshed handler
	
	// Flags
	var _selectBlockin2DFlag = false;	// Whether highlight the selected block in 2D
	
	var _modifiedList = [];		// Store the IDs representing the features modified
	var _labelCollection;
	
	// Viewshed position
	this.viewPosition;
	
	// Public field
	this.viewer = viewer;
	this.mapDiv = mapDiv;
	this.toolDiv = toolDiv;
	this.viewMode = 'Bird-eye';
	this.selectedBlocks = {};	// Selected entities in the scene
	
	this.pointHandler;
	this.viewshed3D;
	
	// Flags
	this.selectBlockFlag = true;		// Whether enable select 3D Blocks. Not implemented yet.
	
	/*
	 * Private functions
	 */
	// Shut down all handlers for drawing/analysis/etc..
	var deactivateHandlers = function(thisObj) {
		_handlerDis.deactivate();
		_handlerHeight.deactivate();
	}
	
	/*
	 * Public functions
	 */
	// Toggle between bird-eye and human-eye mode
	ThreeDView.prototype.toggleViewMode = function() {
		_movementCtrl.toggle();
		
		if(this.viewMode=='Bird-eye')
			this.viewMode = 'Human-eye';
		else
			this.viewMode = 'Bird-eye';
	}
	
	// Start distance measure
	ThreeDView.prototype.initDistanceMeasure = function() {
		deactivateHandlers(this);
		_handlerHeight && _handlerHeight.activate();
	}
	
	// Remove analysis result visualizations, remain blocks
	ThreeDView.prototype.removeAnalysisEntities = function() {
		var entities = this.viewer.entities.values;
		threeDGIS.threeDView.removeAllLabels();
		
		for(var i=entities.length-1; i>-1; i--)
		{
			var id = entities[i].id;
			if(id.substring(0,5)!='BLOCK')
				this.viewer.entities.remove(entities[i]);
		}
		
		_handlerDis.clear();
		_handlerHeight.clear();
		this.viewshed.destroy();
		this.viewshed = new Cesium.ViewShed3D(threeDGIS.threeDView.viewer.scene);
	}
	
	// Add label manually into 3D
	ThreeDView.prototype.addLabel = function(txt, lng, lat, h) {
		if(h==undefined)
		{
			var cartoPos = new Cesium.Cartographic(lng*Math.PI/180, lat*Math.PI/180);
			h = this.viewer.scene.globe.getHeight(cartoPos) + 150;
		}
		
		_labelCollection.add({
			position : Cesium.Cartesian3.fromDegrees(lng,lat,h+5),
			text : txt,
			font : 'bold 28px sans-serif',
			horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
			fillColor : Cesium.Color.FUCHSIA,
			outlineColor : Cesium.Color.BLACK,
			outlineWidth : 1.0,
			style : Cesium.LabelStyle.FILL_AND_OUTLINE
		});
		
		this.viewer.entities.add({
			polyline : {
				positions : Cesium.Cartesian3.fromDegreesArrayHeights([lng,lat,0,
																	   lng,lat,h]),
				width : 3,
				followSurface : false,
				material : new Cesium.PolylineOutlineMaterialProperty({
					color: Cesium.Color.FUCHSIA
				}),
				outlineWidth : 1.0,
				style : Cesium.LabelStyle.FILL_AND_OUTLINE
			},
			id : 'APP_Anno_Line'
		});
	}
	
	ThreeDView.prototype.removeAllLabels = function() {
		_labelCollection.removeAll();
		this.viewer.entities.removeById('APP_Anno_Line');
	}
	
	// Add selection for blocks
	ThreeDView.prototype.addBlockSelection = function(id) {
		this.clearSelection();
		
		if(id!=undefined)
		{
			if(id.substring(0,6)=='BLOCK_')
				id = id.substring(6,id.length);
			
			if (Cesium.defined(this.viewer.entities.getById('BLOCK_'+id))) {
				// Highlight selected block
				var entity = this.viewer.entities.getById('BLOCK_'+id);
				var id = 'BLOCK_'+id;
				var entityHeight = entity.polygon.extrudedHeight.getValue() - entity.polygon.height.getValue();
				
				// Check whether this entity is already included in selected list
				if(this.selectedBlocks[id]==undefined)
				{
					this.selectedBlocks[id] = entity;
					entity.polygon.material = Cesium.Color.AQUA;
				}
				
				// If also highlight the selected block in 2D
				if(_selectBlockin2DFlag)
				{
					;	// Not yet implementing this
				}
				
				// UI on the index
				$('#valueSelectedBlock').html(entity.name);
				$('#exBlockHeight').bootstrapSlider('setValue',entityHeight);
			}
		}
		else if(_modifiedList.length!=0)
		{
			alert('Should be a prompt box ask whether to confirm modification');
			
			// Save change to db
			var entities = [];
			for(var i=0; i<_modifiedList.length; i++)
			{
				entities.push(this.viewer.entities.getById(_modifiedList[i]));
			}
			
			// Suppose only modify the first one, because batch editing not ready on backend...
			var entity = entities[0];
			var baseHeight = entity.polygon.height.getValue();
			var elev = entity.polygon.extrudedHeight.getValue() - baseHeight;
			var id = entity.id.substring(6,entity.id.length);
			
			// Hard code on fields to be modified			
			var json = {
				"fieldNames": ["ELEVATION", "SMID"],
				"fieldValues": [elev+"", id],
				type: "UPDATEHEIGHT"
			};
			
			var dObject = {
				json: JSON.stringify(json)
			};
			
			$.ajax({
				url: host+'/iserver/PolygonEditing.jsp',
				data: dObject,
				dataType: "json",
				method: 'GET',		// Need more advanced jquery version, later than 1.9.0
				success: function (data) {                                  
					var state = data.state;
					if(state=='Success')
					{
						$('#txtSystemInfo').val("Update feature height succeed");
						/*vectorLayer.removeAllFeatures();
						layer.redraw();
						ids=null;
						
						document.getElementById("btnSelect").disabled = false;
						document.getElementById("btnEdit").disabled = true;
						document.getElementById("btnRemove").disabled = true;*/
					}
					else
						$('#txtSystemInfo').val("Update feature failed");
				},
				error: function(err) {
					alert("AJAX function failed");
					console.log(err);
				}
			});
			
			_modifiedList = [];
		}
	}
	
	// Clear selection for blocks
	ThreeDView.prototype.clearSelection = function() {
		for (var property in this.selectedBlocks) {
			if (this.selectedBlocks.hasOwnProperty(property)) {
				this.selectedBlocks[property].polygon.material = Cesium.Color.WHITE;
			}
		}
		this.selectedBlocks = {};
	}
	
	// Update height for selected block
	ThreeDView.prototype.updateHeight = function(h) {
		for (var property in this.selectedBlocks) {
			if (this.selectedBlocks.hasOwnProperty(property)) {
				var polygon = this.selectedBlocks[property].polygon;
				polygon.extrudedHeight = h + polygon.height.getValue();
			}
		}
	}
	
	// Add to modified list when a block has been edited
	// By now just assume that only selected block could be edited
	ThreeDView.prototype.addModifyList = function(id) {
		var id = [];
		
		for (var property in this.selectedBlocks) {
			if (this.selectedBlocks.hasOwnProperty(property)) {
				id.push(this.selectedBlocks[property].id);
			}
		}
		
		for(var i=0; i<id.length; i++)
		{
			if(!_modifiedList.includes(id[i]))
				_modifiedList.push(id[i]);
		}
		
		console.log(_modifiedList);
	}
	
	// Confirm modification for blocks
	ThreeDView.prototype.confirmEdit = function() {
		
	}
	
	// Update geometry for a specified entity
	ThreeDView.prototype.updateGeometry = function(vertexArray, bldgHeight) {
		for (var property in this.selectedBlocks) {
			if (this.selectedBlocks.hasOwnProperty(property)) {
				var polygon = this.selectedBlocks[property].polygon;
				var verticesCartesian = [];
				
				for(var j=0; j<vertexArray.length; j++)
				{
					var y = vertexArray[j].y;
					var x = vertexArray[j].x;
					
					var wgspt = CoordTransform.hk2wgs(x,y);
					
					var cartesian = Cesium.Cartesian3.fromDegrees(wgspt[0], wgspt[1], 0);
					verticesCartesian.push(cartesian);
				}
				
				var cartos = [];
				
				for(var i=0; i<verticesCartesian.length; i++)
				{
					var cartoPos = Cesium.Cartographic.fromCartesian(verticesCartesian[i]);
					cartos.push(cartoPos);
					/*var height = cartoPos.height;
					var terrainHeight = this.viewer.scene.globe.getHeight(cartoPos);
					if(terrainHeight>height)
						height = terrainHeight;
					
					if(height<baseHeight)
						baseHeight = height;*/
				}
				threeDGIS.temp = bldgHeight;
				
				Cesium.sampleTerrain(this.viewer.terrainProvider, 17, cartos)
					.then(function(samples) {
						var baseHeight = 9999;
						for(var i=0; i<samples.length; i++)
						{
							if(samples[i].height<baseHeight)
								baseHeight = samples[i].height;
						}
						
						polygon.hierarchy = new Cesium.PolygonHierarchy(verticesCartesian);
						polygon.height = baseHeight;
						polygon.extrudedHeight = baseHeight + threeDGIS.temp;
					});
			}
		}
	}
	
	// Enable select by clicking
	ThreeDView.prototype.enableClickSelect = function() {
		_handler.setInputAction(function(e){
			var thisObj = threeDGIS.threeDView;
			
			var pickedObject = viewer.scene.pick(e.position);
			var id;
			
			if (Cesium.defined(pickedObject)) {
				// Highlight selected block
				var entity = pickedObject.id;
				id = entity.id;
				
				if(threeDGIS.twoDView.mapDiv.css('display')=='block')
				{
					id = id.substring(6,id.length);
					
					var feature = {
						ID: Number(id)
					};
					
					var args = {
						feature: feature
					};
					
					threeDGIS.twoDView.selectedFeature(args);
				}
			}
			else
			{
				id=undefined;
				if(threeDGIS.twoDView.mapDiv.css('display')=='block')
					threeDGIS.twoDView.vectorLayer.removeAllFeatures();
			}
			
			if(thisObj.selectBlockFlag)
				thisObj.addBlockSelection(id);
		},Cesium.ScreenSpaceEventType.LEFT_CLICK);
	}
	
	// Click to delete a 3D block during editing mode
	ThreeDView.prototype.clickToDelete = function() {
		_handler.setInputAction(function(e){
			var thisObj = threeDGIS.threeDView;
		
			var pickedObject = viewer.scene.pick(e.position);
			var id;
			
			if (Cesium.defined(pickedObject)) {
				// Highlight selected block
				var entity = pickedObject.id;
				id = entity.id;
				
				if(threeDGIS.twoDView.mapDiv.css('display')=='block')
				{
					id = id.substring(6,id.length);
					
					var feature = {
						ID: Number(id)
					};
					var args = {
						feature: feature
					};
					
					threeDGIS.twoDView.selectedFeatureToDelete(args);
				}
			}
			else
				return;
		},Cesium.ScreenSpaceEventType.LEFT_CLICK);
	}
	
	/*
	 * Initialization after construction
	 */
	this.viewer.scene.viewFlag = true;
	// Initialize movement control
	this.viewer.selectionIndicator.viewModel.selectionIndicatorElement.style.visibility = 'hidden'; 
    $('.cesium-infoBox').css('visibility','hidden'); 
	
	_movementCtrl = new MovementCtrl(this.viewer);
	
	// Define mouse click / key handler
	_handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	_viewshedHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	
	// Redefine left click event, may not pop up default sidebar when clicking on entities
	this.enableClickSelect();
	
	// Instantiate distance measurement handler
	_handlerDis = new Cesium.MeasureHandler(this.viewer,Cesium.MeasureMode.Distance);
	_handlerDis.measureEvt.addEventListener(function(result){
		var distance = result.distance > 1000 ? (result.distance/1000).toFixed(2) + 'km' : result.distance + 'm';
		_handlerDis.disLabel.text = 'Distance:' + distance;
	});
	_handlerDis.activeEvt.addEventListener(function(isActive){
		if(isActive == true){
			$('body').removeClass('measureCur').addClass('measureCur');
		}
		else{
			$('body').removeClass('measureCur');
		}
	});
	
	// Instantiate height measurement handler
	_handlerHeight = new Cesium.MeasureHandler(viewer,Cesium.MeasureMode.DVH);
	_handlerHeight.measureEvt.addEventListener(function(result){
		var distance = result.distance > 1000 ? (result.distance/1000).toFixed(2) + 'km' : result.distance + 'm';
		var vHeight = result.verticalHeight > 1000 ? (result.verticalHeight/1000).toFixed(2) + 'km' : result.verticalHeight + 'm';
		var hDistance = result.horizontalDistance > 1000 ? (result.horizontalDistance/1000).toFixed(2) + 'km' : result.horizontalDistance + 'm';
		_handlerHeight.disLabel.text = 'Spacial:' + distance;
		_handlerHeight.vLabel.text = 'Vertical:' + vHeight;
		_handlerHeight.hLabel.text = 'Horizontal:' + hDistance;
	});
	_handlerHeight.activeEvt.addEventListener(function(isActive){
		if(isActive == true){
			$('body').removeClass('measureCur').addClass('measureCur');
		}
		else{
			$('body').removeClass('measureCur');
		}
	});
	
	_viewshedHandler.setInputAction(function(e){
		var thisObj = threeDGIS.threeDView;
		if (!thisObj.viewer.scene.viewFlag) {
			var position = e.endPosition;
			var last = thisObj.viewer.scene.pickPosition(position);

			var distance = Cesium.Cartesian3.distance(thisObj.viewPosition, last);

			if(distance > 0 ){
				var cartographic = Cesium.Cartographic.fromCartesian(last);
				var longitude = Cesium.Math.toDegrees(cartographic.longitude);
				var latitude = Cesium.Math.toDegrees(cartographic.latitude);
				var height = cartographic.height;

				thisObj.viewshed.setDistDirByPoint([longitude, latitude, height]);
				
				if(thisObj.viewshed.distance<400)
					thisObj.viewshed.distance = 400;
			}
		}
	},Cesium.ScreenSpaceEventType.MOUSE_MOVE);

	_viewshedHandler.setInputAction(function(e){
		var thisObj = threeDGIS.threeDView;
		thisObj.viewer.scene.viewFlag = true;
		// pointHandler.deactivate();
	},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
	
	// Init label collection
	_labelCollection = this.viewer.scene.primitives.add(new Cesium.LabelCollection());
	
	// Pick S3M objects event
	this.viewer.pickEvent.addEventListener(function(feature){
		var columns = [];
		var tableObj = {};
		for (var property in feature) {
			if(property.toUpperCase().substr(0,2) != 'SM' || property.toUpperCase()=='SMID')
			{
				columns.push({
					field: property,                   
					title: property,
					sortable: true,
					filter: {
						type: "input"
					}
				});
			}
		}
		
		$('#attributeTable').bootstrapTable('refreshOptions',{
			columns:columns
		});
		$('#attributeTable').bootstrapTable('removeAll');
		$('#attributeTable').bootstrapTable( 'resetView' , {height: 400} );
		$('#attributeTable').bootstrapTable('append', [feature]);
		$('#dialogModal').modal('show');
	});
}