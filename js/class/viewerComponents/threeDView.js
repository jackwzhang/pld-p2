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
	
	// Draw handlers
	var _drawPointHandler = new Cesium.DrawHandler(viewer,Cesium.DrawMode.Point);
	var _drawPolylineHandler = new Cesium.DrawHandler(viewer,Cesium.DrawMode.Line);
	var _drawPolygonHandler = new Cesium.DrawHandler(viewer,Cesium.DrawMode.Polygon);
	
	
	// Viewshed position
	this.viewPosition;
	
	// Public field
	this.viewer = viewer;
	this.mapDiv = mapDiv;
	this.toolDiv = toolDiv;
	this.viewMode = 'Bird-eye';
	this.selectedBlocks = {};	// Selected entities in the scene
	
	this.pointHandler;		// Check where I used this pointHandler
	
	// Analysis object list
	this.analysis3D = {
		viewshed: null,
		sightLine: new SightLine(this.viewer.scene),
	};
	
	// Flags
	this.selectBlockFlag = true;		// Whether enable select 3D Blocks. Not implemented yet.
	this.addGLTFFlag = false;
	this.bufferFlag = false;
	this.analysisFlag = false;		// Detect whether whatever 3D analysis is going on. May consider to split this into different items
	this.identifyingFlag = false;
	
	this.selectedFeature;
	
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
			if(id.substring(0,5)!='BLOCK' && id!='model_gltf')
				this.viewer.entities.remove(entities[i]);
		}
		
		_handlerDis.clear();
		_handlerHeight.clear();
		this.analysis3D.viewshed.destroy();
		this.analysis3D.viewshed = new Cesium.ViewShed3D(threeDGIS.threeDView.viewer.scene);
	
		_drawPointHandler.clear();
		_drawPolylineHandler.clear();
		_drawPolygonHandler.clear();
		
		this.analysis3D.sightLine.clear();
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
	
	// Enable identifying
	ThreeDView.prototype.enableIdentifying = function() {
		var layerBldgVec = viewer.scene.layers.find('bldg_wgs');
		var layerPodiumVec = viewer.scene.layers.find('podium_wgs');
		var layerAAM = viewer.scene.layers.find('AAM_Model');
		
		layerBldgVec.setQueryParameter({
			url: host+'/iserver/services/data-Phase2_Data/rest/data',
			dataSourceName: '10.40.106.82_P2_Sample_Data',
			dataSetName: 'Bldg_HK80',
			keyWord: 'SmID'
		});
		
		layerPodiumVec.setQueryParameter({
			url: host+'/iserver/services/data-Phase2_Data/rest/data',
			dataSourceName: '10.40.106.82_P2_Sample_Data',
			dataSetName: 'Podium_HK80',
			keyWord: 'SmID'
		});
		
		layerAAM.setQueryParameter({
			url: host+'/iserver/services/data-Phase2_Data/rest/data',
			dataSourceName: '10.40.106.82_P2_Sample_Data',
			dataSetName: 'AAM_Model',
			keyWord: 'SmID'
		});
	}
	
	// Disable identifying
	ThreeDView.prototype.disableIdentifying = function() {
		var layerBldgVec = viewer.scene.layers.find('bldg_wgs');
		var layerPodiumVec = viewer.scene.layers.find('podium_wgs');
		var layerAAM = viewer.scene.layers.find('AAM_Model');
		
		layerBldgVec.queryParameter = undefined;
		layerPodiumVec.queryParameter = undefined;
		layerAAM.queryParameter = undefined;
	}
	
	// Compute buffer analysis and overlaying between buffer and specified layer
	ThreeDView.prototype.computeBuffer = function(result){
		if(threeDGIS.threeDView.bufferFlag)
		{
			var drawObject = result.object;
			var region;		// The geometry for calculating the buffer
			
			// Point mode
			if(drawObject instanceof Cesium.PointPrimitive)
			{
				var cartesian = drawObject.position;
				var carto = Cesium.Cartographic.fromCartesian(cartesian);
				var hkpt = CoordTransform.wgs2hk(carto.longitude*180/Math.PI, carto.latitude*180/Math.PI);
				
				region = new SuperMap.Geometry.Point(hkpt[0], hkpt[1]);
			}
			// Polyline mode
			else if(drawObject instanceof Cesium.Polyline)
			{
				var cartesians = drawObject.positions;
				console.log(cartesians);
				
				var points = [];
				for(var i=0; i<cartesians.length; i++)
				{
					var carto = Cesium.Cartographic.fromCartesian(cartesians[i]);
					var hkpt = CoordTransform.wgs2hk(carto.longitude*180/Math.PI, carto.latitude*180/Math.PI);
					
					points.push(new SuperMap.Geometry.Point(hkpt[0], hkpt[1]));
				}
				region = new SuperMap.Geometry.LineString(points);
			}
			// Polygon mode
			else if((drawObject instanceof Cesium.Entity && drawObject._polygon) || drawObject.polygon instanceof Cesium.PolygonGraphics)
			{
				var polygon = result.object.polygon;
				var point2Ds = [];
				
				if(polygon.hierarchy)
				{
					var hierarchy = polygon.hierarchy.getValue();
					if(hierarchy.length==undefined)
						hierarchy = hierarchy.positions;
					
					for(var i=0; i<hierarchy.length; i++)
					{
						var cartographic = Cesium.Cartographic.fromCartesian(hierarchy[i]);
						var hkpt = CoordTransform.wgs2hk(cartographic.longitude*180/Math.PI, cartographic.latitude*180/Math.PI);
						point2Ds.push(new SuperMap.Geometry.Point(hkpt[0], hkpt[1]));
					}
					var linearRings = new SuperMap.Geometry.LinearRing(point2Ds);
					var region = new SuperMap.Geometry.Polygon([linearRings]);
				}
				else
					region = polygon;
			}
			// Polygon from identified feature
			else
				region = drawObject.polygon;
			
			// HARD CODE determining which layer to search
			// Think twice about this
			
			var selectedFeatureProcessCompleted = function(e)
			{
				var features = e.result.features;
				ThreeDGIS.rewriteAttributeTable(features);
				
				$('#iconAttributeTable').click();
				
				if(features.length>0)
				{
					if(features[0].attributes.BUILDINGID!=undefined)		// Very serious hard code here
					{
						var layerBldgVec = viewer.scene.layers.find('bldg_wgs');
						layerBldgVec.releaseSelection();
						var selectedIDs = [];
						for(var i=0; i<features.length; i++)
							selectedIDs.push(Number(features[i].data["SMID"]));
							
						layerBldgVec.setSelection(selectedIDs);
					}
				}
				
				_drawPointHandler.clear();
				_drawPolylineHandler.clear();
				_drawPolygonHandler.clear();
				
				threeDGIS.threeDView.bufferFlag = false;
			}
			
			var processFailed = function(e){console.log('Buffer not successful');}
			
			if($('#bfrLayer').val()=='Bldg_HK80')
			{
				var getFeaturesByGeometryParams = new SuperMap.REST.GetFeaturesByBufferParameters({
					datasetNames: ["10.40.106.82_P2_Sample_Data:Bldg_HK80"],		// Using hardcode
					bufferDistance: Number($('#bfrSize').val()),
					geometry: region,
					toIndex:9999
				});
				var getFeaturesByGeometryService = new SuperMap.REST.GetFeaturesByBufferService(host+'/iserver/services/data-Phase2_Data/rest/data/', {
					eventListeners: {
						"processCompleted": selectedFeatureProcessCompleted,
						"processFailed": processFailed
					}
				});
				getFeaturesByGeometryService.processAsync(getFeaturesByGeometryParams);
			}
			else if($('#bfrLayer').val()=='Lot')
			{
				var getFeaturesByGeometryParams = new SuperMap.REST.GetFeaturesByBufferParameters({
					datasetNames: ["10.40.106.82_R3DGIS_GISDB:Lot"],		// Using hardcode
					bufferDistance: Number($('#bfrSize').val()),
					geometry: region,
					toIndex:9999
				});
				var getFeaturesByGeometryService = new SuperMap.REST.GetFeaturesByBufferService(host+'/iserver/services/data-Phase2_Data/rest/data/', {
					eventListeners: {
						"processCompleted": selectedFeatureProcessCompleted,
						"processFailed": processFailed
					}
				});
				getFeaturesByGeometryService.processAsync(getFeaturesByGeometryParams);
			}
			else if($('#bfrLayer').val()=='Application')
			{
				var getFeaturesByGeometryParams = new SuperMap.REST.GetFeaturesByBufferParameters({
					datasetNames: ["10.40.106.82_R3DGIS_GISDB:APPLICATION"],		// Using hardcode
					bufferDistance: Number($('#bfrSize').val()),
					geometry: region,
					toIndex:9999
				});
				var getFeaturesByGeometryService = new SuperMap.REST.GetFeaturesByBufferService(host+'/iserver/services/data-Phase2_Data/rest/data/', {
					eventListeners: {
						"processCompleted": selectedFeatureProcessCompleted,
						"processFailed": processFailed
					}
				});
				getFeaturesByGeometryService.processAsync(getFeaturesByGeometryParams);
				
			}
			
			var bufferAnalystCompleted = function(args) {
				if(args){
					var bufferResultGeometry = args.result.resultGeometry;
					var hkVertices = bufferResultGeometry.getVertices();
					
					// Convert the HK80 coordinate of the vertices to WGS84 and then plot out
					var wgsVertices = [];
					for(var i=0; i<hkVertices.length; i++)
					{
						var wgspt = CoordTransform.hk2wgs(hkVertices[i].x, hkVertices[i].y);
						wgsVertices.push(Cesium.Cartesian3.fromDegrees(wgspt[0],wgspt[1]));
					}
					
					var polygon = new Cesium.PolygonGraphics({
						hierarchy: new Cesium.PolygonHierarchy(wgsVertices),
						material: new Cesium.Color(0.0, 1.0, 1.0, 0.7),
						outline: true,
						outlineColor : Cesium.Color.BLACK,
					});
					
					threeDGIS.threeDView.viewer.entities.add({
						id: 'analyze_buffer',
						polygon: polygon,
						outline: true,
						shadows: Cesium.ShadowMode.ENABLED		// Does not seem to be working
					});
				}
			}
			
			var bufferServiceByGeometry = new SuperMap.REST.BufferAnalystService(host+'/iserver/services/spatialAnalysis-Phase2_Data/restjsr/spatialanalyst'),
				bufferDistance = new SuperMap.REST.BufferDistance({
					value: Number($('#bfrSize').val())
				}),
				bufferSetting = new SuperMap.REST.BufferSetting({
					endType: SuperMap.REST.BufferEndType.ROUND,
					leftDistance: bufferDistance,
					rightDistance: bufferDistance,
					semicircleLineSegment: 20
				}),
				geoBufferAnalystParam = new SuperMap.REST.GeometryBufferAnalystParameters({
					sourceGeometry: region,
					bufferSetting: bufferSetting
				});

			bufferServiceByGeometry.events.on({"processCompleted": bufferAnalystCompleted});
			bufferServiceByGeometry.processAsync(geoBufferAnalystParam);
		}
		
		// thisObj.pointBufferFlag = false;
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
	
	// Enable sync to 2D
	// Collision with 2D->3D sync, consider this before enabling this function
	ThreeDView.prototype.syncWith2D = function(isActivated) {
		if(isActivated)
		{
			_handler.setInputAction(threeDGIS.SceneToMap,Cesium.ScreenSpaceEventType.LEFT_UP);
			_handler.setInputAction(threeDGIS.SceneToMap,Cesium.ScreenSpaceEventType.WHEEL);
		}
		else
		{
			_handler.removeInputAction(threeDGIS.SceneToMap,Cesium.ScreenSpaceEventType.LEFT_UP);
			_handler.removeInputAction(threeDGIS.SceneToMap,Cesium.ScreenSpaceEventType.WHEEL);
		}
	}
	
	// Enable select by clicking
	ThreeDView.prototype.enableClickSelect = function() {
		_handler.setInputAction(function(e){
			var thisObj = threeDGIS.threeDView;
			var viewer = thisObj.viewer;
			var scene = viewer.scene;
			var cartesianPosition = scene.pickPosition(e.position);
			
			if(thisObj.addGLTFFlag)
			{
				var cartographic = Cesium.Cartographic.fromCartesian(cartesianPosition);
				var hpr = new Cesium.HeadingPitchRoll($('#exGLTFRotation').bootstrapSlider('getValue')*Math.PI/180, 0, 0);
				var orientation = Cesium.Transforms.headingPitchRollQuaternion(cartesianPosition, hpr);
				
				viewer.entities.removeById('model_gltf');
				
				var entity = viewer.entities.add({
					name: 'model_gltf',
					id: 'model_gltf',
					position: cartesianPosition,
					orientation : orientation,
					model: {
						uri : 'assets/model/glTF/H10G0244.gltf',
						scale: $('#exGLTFScale').bootstrapSlider('getValue'),
					}
				});
				
				thisObj.addGLTFFlag = false;
				$('#gltfModal').modal('show');
			}
			
			// Able to rotate the model with the following
			// entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(entity.position.getValue(new Cesium.JulianDate()), new Cesium.HeadingPitchRoll(1.4, 0, 0));
			
			var pickedObject = viewer.scene.pick(e.position);
			var id;
			
			if (Cesium.defined(pickedObject)) {
				// Highlight selected block
				var entity = pickedObject.id;
				if(entity==undefined)
				{
					id=undefined;
					if(threeDGIS.twoDView.mapDiv.css('display')=='block')
						threeDGIS.twoDView.vectorLayer.removeAllFeatures();
				}
				else
				{
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
			}
			else
			{
				id=undefined;
				if(threeDGIS.twoDView.mapDiv.css('display')=='block')
					threeDGIS.twoDView.vectorLayer.removeAllFeatures();
			}
			
			if(thisObj.selectBlockFlag)
				thisObj.addBlockSelection(id);
				
			// Show distance from camera to picked position in infobox
			var cp = threeDGIS.threeDView.viewer.camera.position;
			if(cp==undefined)
				threeDGIS.writeInfo('Click position not identifiable');
			else
			{
				var camClickDistance = Cesium.Cartesian3.distance(cartesianPosition, cp);
				threeDGIS.writeInfo('Camera to picked point distance: '+camClickDistance.toFixed(3)+'m');
			}
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
			{
				return;
			}
		},Cesium.ScreenSpaceEventType.LEFT_CLICK);
	}
	
	// Start drawing
	ThreeDView.prototype.startDrawing = function(type) {
		_drawPointHandler.clear();
		_drawPolylineHandler.clear();
		_drawPolygonHandler.clear();
		
		switch(type) {
			case 'point':
				_drawPointHandler.activate();
				break;
			case 'polyline':
				_drawPolylineHandler.activate();
				break;
			case 'polygon':
				_drawPolygonHandler.activate();
				break;
			case 'object':
				var pickForBuffer = function(e)
				{
					var thisObj = threeDGIS.threeDView;
					var viewer = thisObj.viewer;
					var pickedObject = viewer.scene.pick(e.position);
					
					if (Cesium.defined(pickedObject)) {
						// Highlight selected block
						var entity = pickedObject.id;
						if(entity==undefined)
						{
							id=undefined;
							if(threeDGIS.twoDView.mapDiv.css('display')=='block')
								threeDGIS.twoDView.vectorLayer.removeAllFeatures();
						}
						else
						{
							id = entity.id;
							
							threeDGIS.threeDView.addBlockSelection(id);
							var polygon = entity.polygon;
							var object = {
								polygon: polygon
							};
							var result = {
								object: object
							};
							
							threeDGIS.threeDView.computeBuffer(result);
						}
						
						_handler.removeInputAction(pickForBuffer,Cesium.ScreenSpaceEventType.LEFT_CLICK);
						threeDGIS.threeDView.enableClickSelect();
					}
				}
				
				_handler.setInputAction(pickForBuffer,Cesium.ScreenSpaceEventType.LEFT_CLICK);
				break;
		}
	}
	
	ThreeDView.prototype.sightLineAnalysis = function() {
		var sightLine = this.analysis3D.sightLine;
		sightLine.clear();
		
		function addSightLinePoint(e) {
			var thisObj = threeDGIS.threeDView;
			var viewer = thisObj.viewer;
			var cartesianPosition = viewer.scene.pickPosition(e.position);
			var carto = Cesium.Cartographic.fromCartesian(cartesianPosition);
			
			sightLine.addPoint(carto);

			threeDGIS.writeInfo('Left click to add target point. Right click to finish.');
		}
		
		function moveTarget(e) {
			var position = e.endPosition;
			var cartesianPosition = threeDGIS.threeDView.viewer.scene.pickPosition(position);
			var carto = Cesium.Cartographic.fromCartesian(cartesianPosition);
			
			if(sightLine.pointCount>0)
			{
				sightLine.removeLastTargetPoint();
				sightLine.addPoint(carto);
			}
		}
		
		function finishAnalysis() {
			// This right click and mouse move event is not cancelling
			_handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
			_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
			
			
			_handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
			threeDGIS.writeInfo('Line of sight analysis finished.');
			threeDGIS.threeDView.enableClickSelect();
			
			// Remove mouse move target
			// sightLine.removeLastTargetPoint();
		}
		
		_handler.setInputAction(addSightLinePoint,Cesium.ScreenSpaceEventType.LEFT_CLICK);
		_handler.setInputAction(moveTarget, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		_handler.setInputAction(finishAnalysis,Cesium.ScreenSpaceEventType.RIGHT_CLICK);
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

				thisObj.analysis3D.viewshed.setDistDirByPoint([longitude, latitude, height]);
				
				if(thisObj.analysis3D.viewshed.distance<400)
					thisObj.analysis3D.viewshed.distance = 400;
			}
		}
	},Cesium.ScreenSpaceEventType.MOUSE_MOVE);

	_viewshedHandler.setInputAction(function(e){
		var thisObj = threeDGIS.threeDView;
		thisObj.viewer.scene.viewFlag = true;
		thisObj.analysisFlag = false;
		// pointHandler.deactivate();
	},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
	
	// Init label collection
	_labelCollection = this.viewer.scene.primitives.add(new Cesium.LabelCollection());
	
	// Pick S3M objects event
	this.viewer.pickEvent.addEventListener(function(feature){
		if(threeDGIS.threeDView.analysisFlag)
			;	// Don't do anything about picked feature during anylysis
		else if(threeDGIS.threeDView.bufferFlag)
		{
			var id = feature.SMID;
			// console.log(feature);	// But how to get to know which layer the feature belongs to?
			
			var layerBldgVec = viewer.scene.layers.find('bldg_wgs');
			var layerPodiumVec = viewer.scene.layers.find('podium_wgs');
			var layerAAM = viewer.scene.layers.find('AAM_Model');
			
			var bldgSelect = layerBldgVec.getSelection();
			var podiumSelect = layerPodiumVec.getSelection();
			var aamSelect = layerAAM.getSelection();
			
			var datasetName, selectedID;
			// May need some loop instead of hard code like this
			if(bldgSelect.length==1)
			{
				datasetName = 'Bldg_HK80';	// Apply the selected id to find the feature polygon and calculate buffer based on this geometry
				selectedID = bldgSelect[0];
			}
			else if(podiumSelect.length==1)
			{
				datasetName = 'Podium_HK80';
				selectedID = podiumSelect[0];
			}
			else if(aamSelect.length==1)
			{
				datasetName = 'AAM_Model';
				selectedID = aamSelect[0];
			}
			else
				return;
				
			getFeatureParam = new SuperMap.REST.FilterParameter({
				name: datasetName+'@10.40.106.82_P2_Sample_Data',
				//attributeFilter: "APP_CASE_NO='"+attributeValue+"'"
				attributeFilter: 'SMID='+selectedID
			});
			
			getFeatureBySQLParams = new SuperMap.REST.GetFeaturesBySQLParameters({
				queryParameter: getFeatureParam,
				datasetNames:["10.40.106.82_P2_Sample_Data:"+datasetName],		// Hardcode
				toIndex: 999999
			});
			// Note to redefine the 'host' to make it better
			getFeatureBySQLService = new SuperMap.REST.GetFeaturesBySQLService(host + '/iserver/services/data-Phase2_Data/rest/data', {
				eventListeners: {"processCompleted": QueryCompleted, "processFailed": undefined}
			});

			getFeatureBySQLService.processAsync(getFeatureBySQLParams);
			
			function QueryCompleted(e) {
				var geometry = e.result.features[0].geometry;
				var object = {
					polygon: geometry
				};
				var result = {
					object: object
				};
				
				threeDGIS.threeDView.computeBuffer(result);
			}
		}
		else
		{
			var columns = [];
			
			columns.push({
				field: 'C1',
				title: 'C1',
			});
			columns.push({
				field: 'C2',
				title: 'C2',
			});
			
			/*var tableObj = {};
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
			}*/
			
			$('#attributeTable').bootstrapTable('refreshOptions',{
				columns:columns,
				pagination: false,
				showHeader: false
			});
			
			$('#attributeTable').bootstrapTable('removeAll');
			$('#attributeTable').bootstrapTable( 'resetView' , {height: 500} );
			var tableRows = [];
			for (var property in feature) {
				if(property.toUpperCase().substr(0,2) != 'SM' || property.toUpperCase()=='SMID')
				{
					tableRows.push({
						C1: property,
						C2: feature[property]
					});
				}
			}
			// $('#attributeTable').bootstrapTable('append', [feature]);
			$('#attributeTable').bootstrapTable('append', tableRows);
			$('#dialogModal').modal('show');
			
			threeDGIS.threeDView.selectedFeature = feature;
		}
	});
	
	// Draw handler, mainly drawing to prepare for analysis
	// The event handler may not be called 'computeBuffer', but checks the buffer flag and others
	_drawPointHandler.drawEvt.addEventListener(this.computeBuffer);
	_drawPolylineHandler.drawEvt.addEventListener(this.computeBuffer);
	_drawPolygonHandler.drawEvt.addEventListener(this.computeBuffer);
}