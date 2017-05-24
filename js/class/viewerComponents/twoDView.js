function TwoDView(map, mapDiv, toolDiv)
{
	// Public field pre-defined
	this.map = map;
	this.mapDiv = mapDiv;
	this.toolDiv = toolDiv;
	
	// Public field computed
	this.ctrlDrawPolygon;	// Draw polygon control
	this.ctrlDrawPoint;		// Draw point control
	this.ctrlMoveFeature;	// Move feature control
	this.ctrlModifyVertex;	// Modify vertex control
	
	this.vectorLayer;	// Vector layer for drawing on the map
	this.feature;	// Feature selected in the map
	
	/*
	 * Private functions
	 */

	/*
	 * Public functions
	 */
	// initiate the map if the map is previously undefined
	TwoDView.prototype.initMap = function(map) {
		this.map = map;
		
		this.vectorLayer = new SuperMap.Layer.Vector("Vector Layer");
		
		this.ctrlDrawPolygon = new SuperMap.Control.DrawFeature(this.vectorLayer, SuperMap.Handler.Polygon);
		this.ctrlDrawPoint = new SuperMap.Control.DrawFeature(this.vectorLayer, SuperMap.Handler.Point);
		this.ctrlMoveFeature = new SuperMap.Control.DragFeature(this.vectorLayer);
		this.ctrlModifyVertex = new SuperMap.Control.ModifyFeature(this.vectorLayer);
		
		var scaleline = new SuperMap.Control.ScaleLine();
		this.map.addControl(this.ctrlDrawPolygon);
		this.map.addControl(this.ctrlDrawPoint);
		this.map.addControl(this.ctrlMoveFeature);
		this.map.addControl(this.ctrlModifyVertex);
		this.map.addControl(scaleline);
		this.map.addControl(new SuperMap.Control.MousePosition({
			numDigits: 3
		}));
		
		this.ctrlModifyVertex.events.on({'featuremodified':function(e){
			var feature = e.feature;
			var thisObj = threeDGIS.twoDView;
			var area = feature.geometry.getArea();
			var height = $('#exBlockHeight').bootstrapSlider('getValue');
			var floorNo = Math.floor(height/3);
			
			// Get feature area by 'feature.geometry.getGeodesicArea()'
			// Get feature perimeter by 'feature.geometry.getGeodesicLength()'
			$('#txtHt').html(height + ' m');
			$('#txtNoFloor').html(floorNo);
			$('#txtArea').html(Number(area).toFixed(3)+' sqm');
			$('#txtGFA').html(Number(area*floorNo).toFixed(3));
			
			thisObj.onMove(feature);
		}});
	}
	 
	// Add layers into the map
	TwoDView.prototype.addLayer = function(mapName, mapURL) {
		// var baseLayer = new SuperMap.Layer.TiledDynamicRESTLayer(mapName, mapURL, {transparent: true, cacheEnabled: true}, {maxResolution: "auto"});
		var baseLayer = new SuperMap.Layer.TiledDynamicRESTLayer(mapName, mapURL, {transparent: true, cacheEnabled: false}, {maxResolution:"auto",bufferImgCount:0});
		baseLayer.events.on({"layerInitialized": addMapLayer});
		
		var thisObj = this;
		function addMapLayer() {
			var layers = [];
			layers.push(baseLayer);
			if(thisObj.map.getLayersByName('Vector Layer')[0]==undefined)
				layers.push(thisObj.vectorLayer);
			
			thisObj.map.addLayers(layers);
			
			
			// If these are the first layers added, change center
			if(thisObj.map.layers.length==layers.length)
			{
				thisObj.map.setCenter(new SuperMap.LonLat(834769.23, 816111.0), 1);
				thisObj.map.zoomToScale(5000);
				thisObj.ctrlDrawPoint.events.on({"featureadded": threeDGIS.twoDView.selectedFeature});
				thisObj.ctrlDrawPoint.activate();
			}
			thisObj.map.allOverlays = true;
			thisObj.map.raiseLayer(thisObj.map.getLayersByName('Vector Layer')[0],1);
			
			if(baseLayer.name=="BaseMap")
				threeDGIS.twoDView.addLayer("blocks",host+"/iserver/services/map-Phase2_Data/rest/maps/Proposed_Building");
		}
	}
	
	// init draw controls
	TwoDView.prototype.initDraw = function() {
		if(SuperMap.Map.prototype.isPrototypeOf(this.map))
		{
			if(this.ctrlDrawPolygon==undefined)
			{
				var vectorLayer = this.map.getLayersByName('Vector Layer')[0];
				
				this.ctrlDrawPolygon = new SuperMap.Control.DrawFeature(vectorLayer, SuperMap.Handler.Polygon);
				this.ctrlDrawPoint = new SuperMap.Control.DrawFeature(vectorLayer, SuperMap.Handler.Point);
				this.map.addControl(this.ctrlDrawPolygon);
				this.map.addControl(this.ctrlDrawPoint);
			}
		}
	}
	
	// Deactivate all handlers
	TwoDView.prototype.deactivateAll = function() {
		// this.ctrlDrawPoint.deactivate();		// May not activate ctrlDrawPoint
		this.ctrlDrawPolygon.deactivate();
		this.ctrlMoveFeature.deactivate();
		this.ctrlModifyVertex.deactivate();
	}
	
	// Completed adding features by drawing on 2D map
	TwoDView.prototype.addFeatureCompletedHandler = function(drawGeometryArgs) {
		var thisObj = threeDGIS.twoDView;	// May change 'threeDGIS.twoDView' to 'this' or something, but 'this' is not the object itself here...
		var style = {
			strokeColor: "#304DBE",
			strokeWidth: 1,
			pointerEvents: "visiblePainted",
			fillColor: "#304DBE",
			fillOpacity: 0.8,
			pointRadius:2
		};
		
		thisObj.ctrlDrawPolygon.deactivate();
		var geometry = drawGeometryArgs.feature.geometry,
				feature = new SuperMap.Feature.Vector();
		feature.geometry = drawGeometryArgs.feature.geometry,
				feature.style = style;
		thisObj.vectorLayer.addFeatures(feature);

		geometry.id = "100000";
		
		var smVertices = geometry.getVertices();
		var jsonString = '{"points":[';
		
		for(var i=0; i<smVertices.length; i++)
		{
			if(i!=0)
				jsonString += ',';
			
			var x = smVertices[i].x;
			var y = smVertices[i].y;
			jsonString += '{"x":'+x+',"y":'+y+'}';
		}
		jsonString += '],"BaseHeight":'+/*document.getElementById("txtBase").value*/'0'+',"Elevation":'+/*document.getElementById("txtHeight").value*/'60'+',"type":"ADD"}';
		
		jsonString += '],"type":"ADD"}';
		var dObject = {
			json: jsonString
		};
		
		$.ajax({
			url: host+'/iserver/PolygonEditing.jsp',
			data: dObject,
			dataType: "json",
			method: 'POST',		// Need more advanced jquery version, later than 1.9.0
			success: function (data) {                                  
				var state = data.state;
				if(state=='Success')
				{
					$('#txtSystemInfo').val("Add feature succeed");
					console.log(data);
					thisObj.vectorLayer.removeAllFeatures();
					threeDGIS.threeDView.addBlockSelection();
					for(var i=0; i<thisObj.map.layers.length; i++)
					{
						if(thisObj.map.layers[i] instanceof SuperMap.Layer.TiledDynamicRESTLayer)
							thisObj.map.layers[i].redraw();
					}
					
					// Draw block on 3D
					var cartesianVertices = [];
					// HARD CODE. TO BE MODIFIED AFTER UI IS READY
					var baseHeight = 0;
					var extrudeHeight = 60;
					
					for(var j=0; j<smVertices.length; j++)
					{
						var y = smVertices[j].y;
						var x = smVertices[j].x;
						
						/*var wgspt = CoordTransform.hk2wgs(x,y);
						
						var cartesian = Cesium.Cartesian3.fromDegrees(wgspt[0], wgspt[1], baseHeight);
						verticesCartesian.push(cartesian);*/
						
						cartesianVertices.push(CoordTransform.hk2cartesian(x,y,baseHeight));
					}
					
					var tbk = new ThreeDBlock({
						vertices: cartesianVertices,
						extrudeHeight: extrudeHeight,
						// baseHeight: baseHeight,
						blockName: 'dummy',
						id: data.ID,	// Read the id of the newly added feature
						viewer: threeDGIS.threeDView.viewer		// Hard code, specifying the 3D viewer to be updated
					});
					
					thisObj.ctrlDrawPoint.activate();
				}
				else
					$('#txtSystemInfo').val("Add feature failed");
			},
			error: function(err) {
				//console.log(err);
				alert("AJAX function failed");
				//$('#log').html(err.responseText);
			}
		});
	}
	
	// Enable selecting a block to delete
	TwoDView.prototype.selectedFeatureToDelete = function (drawGeometryArgs) {
		var thisObj = threeDGIS.twoDView;	// May change 'threeDGIS.twoDView' to 'this' or something, but 'this' is not the object itself here...
		var map = thisObj.map;
		var vectorLayer = thisObj.vectorLayer;
		
		var selectedFeatureProcessCompleted = function(getFeaturesEventArgs) {
			var features,
				feature,
				i, len,
				originFeatures = getFeaturesEventArgs.originResult.features,
				result = getFeaturesEventArgs.result;
			vectorLayer.removeAllFeatures();
			threeDGIS.threeDView.addBlockSelection();
			if(originFeatures === null || originFeatures.length === 0) {
				// alert("No polygon found.");
				return;
			}
			ids = new Array();
			//?????????ID????,????????,??????????null,???????????????????????
			for(i = 0, len = originFeatures.length; i < len; i++) {
				ids.push(originFeatures[i].ID);
			}
			
			if(ids==null)
			{
				alert("Please select a polygon first");
			}
			else{
				var jsonString = '{"ids":[';
			
				for(var i=0; i<ids.length; i++)
				{
					if(i!=0)
						jsonString += ',';
					jsonString += ids;
				}
				jsonString += '],"type":"DELETE"}';
				
				var dObject = {
					json: jsonString
				};
				
				$.ajax({
					url: host+'/iserver/PolygonEditing.jsp',
					data: dObject,
					dataType: "json",
					method: 'POST',		// Need more advanced jquery version, later than 1.9.0
					success: function (data) {                                  
						var state = data.state;
						if(state=='Success')
						{
							$('#txtArea').html('');
							$('#txtGFA').html('');
							$('#txtHt').html('');
							$('#txtNoFloor').html('');
							
							$('#txtSystemInfo').val("Delete feature success");
							
							thisObj.ctrlDrawPoint.events.un({"featureadded": threeDGIS.twoDView.selectedFeatureToDelete});
							thisObj.ctrlDrawPoint.events.on({"featureadded": threeDGIS.twoDView.selectedFeature});
							//??????
							vectorLayer.removeAllFeatures();
							threeDGIS.threeDView.addBlockSelection();
							for(var i=0; i<thisObj.map.layers.length; i++)
							{
								if(thisObj.map.layers[i] instanceof SuperMap.Layer.TiledDynamicRESTLayer)
									thisObj.map.layers[i].redraw();
							}
							
							// Remove block in 3D
							for(var i=0; i<ids.length; i++)
							{
								var id = ids[i];
								var idLength = id.length;
								
								var viewer = threeDGIS.threeDView.viewer;		// Hard code specifying 3D viewer to be updated
								viewer.entities.removeById('BLOCK_'+id);
							}
							
							threeDGIS.threeDView.enableClickSelect();
						}
						else
							$('#txtSystemInfo').val("Delete feature failed");
					},
					error: function(err) {
						//console.log(err);
						alert("AJAX function failed");
						//$('#log').html(err.responseText);
					}
				});
			}
		}
		
		// thisObj.ctrlDrawPoint.deactivate();
		var getFeaturesByGeometryParams,
			getFeaturesByGeometryService,
			geometry = drawGeometryArgs.feature.geometry;
			
		if(geometry!=undefined)
		{
			var getFeaturesByGeometryParams = new SuperMap.REST.GetFeaturesByBufferParameters({
				datasetNames: ["SQLServerSource:Proposed_Building"],
				bufferDistance: 0.000005,
				geometry: geometry
			});
			var getFeaturesByGeometryService = new SuperMap.REST.GetFeaturesByBufferService(host+"/iserver/services/data-PlanD_Phase1/rest/data", {
				eventListeners: {
					"processCompleted": selectedFeatureProcessCompleted,
					"processFailed": processFailed
				}
			});
			getFeaturesByGeometryService.processAsync(getFeaturesByGeometryParams);
		}
		else
		{
			var getFeaturesByGeometryParams = new SuperMap.REST.GetFeaturesByIDsParameters({
				datasetNames: ["SQLServerSource:Proposed_Building"],
				IDs: [drawGeometryArgs.feature.ID]
			});
			
			var getFeaturesByGeometryService = new SuperMap.REST.GetFeaturesByIDsService(host+"/iserver/services/data-PlanD_Phase1/rest/data", {
				eventListeners: {
					"processCompleted": selectedFeatureProcessCompleted,
					"processFailed": processFailed
				}
			});
			getFeaturesByGeometryService.processAsync(getFeaturesByGeometryParams);
		}
	}
	
	// Select and highlight a block
	TwoDView.prototype.selectedFeature = function (drawGeometryArgs) {
		var thisObj = threeDGIS.twoDView;	// May change 'threeDGIS.twoDView' to 'this' or something, but 'this' is not the object itself here...
		var map = thisObj.map;
		var vectorLayer = thisObj.vectorLayer;
		
		var selectedFeatureProcessCompleted = function(getFeaturesEventArgs) {
			var thisObj = threeDGIS.twoDView;
			
			var features,
				feature,
				i, len,
				originFeatures = getFeaturesEventArgs.originResult.features,
				result = getFeaturesEventArgs.result,
				style = {
					strokeColor: "#304DBE",
					strokeWidth: 1,
					pointerEvents: "visiblePainted",
					fillColor: "#304DBE",
					fillOpacity: 0.8,
					pointRadius:2
				};
			vectorLayer.removeAllFeatures();
			if(originFeatures === null || originFeatures.length === 0) {
				// alert("No polygon found.");
				threeDGIS.threeDView.addBlockSelection();
				thisObj.feature = undefined;
				
				$('#txtArea').html('');
				$('#txtGFA').html('');
				$('#txtHt').html('');
				$('#txtNoFloor').html('');
				$('#btnEditConfirm').prop('disabled', true);
				return;
			}
			ids = new Array();
			//?????????ID????,????????,??????????null,???????????????????????
			for(i = 0, len = originFeatures.length; i < len; i++) {
				ids.push(originFeatures[i].ID);
			}
			
			if (result && result.features) {
				features = result.features;
				for (var j=0, len = features.length; j<len; j++) {
					feature = features[j];
					feature.style = style;
					vectorLayer.addFeatures(feature);
					thisObj.feature = feature;
					
					// Select the feature in 3D
					threeDGIS.threeDView.addBlockSelection(feature.data.SMID);
					var area = feature.attributes.SMAREA;
					var height = feature.attributes.ELEVATION;
					var floorNo = Math.floor(Number(height)/3);
					
					$('#txtHt').html(height + ' m');
					$('#txtNoFloor').html(floorNo);
					
					$('#txtArea').html(Number(area).toFixed(3)+' sqm');
					$('#txtGFA').html(Number(area*floorNo).toFixed(3));
				}
				$('#btnEditConfirm').prop('disabled', false);
			}
		}
		
		// thisObj.ctrlDrawPoint.deactivate();
		var getFeaturesByGeometryParams,
			getFeaturesByGeometryService,
			geometry = drawGeometryArgs.feature.geometry;
		
		if(geometry!=undefined)
		{
			var getFeaturesByGeometryParams = new SuperMap.REST.GetFeaturesByBufferParameters({
				datasetNames: ["SQLServerSource:Proposed_Building"],
				bufferDistance: 0.000005,
				geometry: geometry
			});
			
			var getFeaturesByGeometryService = new SuperMap.REST.GetFeaturesByBufferService(host+"/iserver/services/data-PlanD_Phase1/rest/data", {
				eventListeners: {
					"processCompleted": selectedFeatureProcessCompleted,
					"processFailed": processFailed
				}
			});
			getFeaturesByGeometryService.processAsync(getFeaturesByGeometryParams);
		}
		else
		{
			var getFeaturesByGeometryParams = new SuperMap.REST.GetFeaturesByIDsParameters({
				datasetNames: ["SQLServerSource:Proposed_Building"],
				IDs: [drawGeometryArgs.feature.ID]
			});
			
			var getFeaturesByGeometryService = new SuperMap.REST.GetFeaturesByIDsService(host+"/iserver/services/data-PlanD_Phase1/rest/data", {
				eventListeners: {
					"processCompleted": selectedFeatureProcessCompleted,
					"processFailed": processFailed
				}
			});
			getFeaturesByGeometryService.processAsync(getFeaturesByGeometryParams);
		}
	}
	
	TwoDView.prototype.updateFeature = function (event) {
		var thisObj = threeDGIS.twoDView;	// May change 'threeDGIS.twoDView' to 'this' or something, but 'this' is not the object itself here...
		var map = thisObj.map;
		var vectorLayer = thisObj.vectorLayer;

		thisObj.deactivateAll();
		var editFeatureParameter,
			editFeatureService,
			features,
			attributes,
			feature;
			
		if(event==undefined)
			feature = this.feature;

		attributes = feature.attributes;
		var attrNames = [];
		var attrValues = [];
		for(var attr in attributes) {
			attrNames.push(attr);
			attrValues.push(attributes[attr]);
		} 
		
		features = {
			fieldNames:attrNames,
			fieldValues:attrValues,
			geometry:feature.geometry
		};
		features.geometry.id = feature.fid;
		
		var geometry = features.geometry;
		geometry.id = feature.fid;
		
		var smVertices = geometry.getVertices();
		//var jsonString = '{"points":[{"x":834674,"y":815739},{"x":834475,"y":815739},{"x":834475,"y":815542}],"type":"ADD"}';
		var jsonString = '{"points":[';
		
		for(var i=0; i<smVertices.length; i++)
		{
			if(i!=0)
				jsonString += ',';
			
			var x = smVertices[i].x;
			var y = smVertices[i].y;
			jsonString += '{"x":'+x+',"y":'+y+'}';
		}

		jsonString += '],"fieldNames":[';
		for(var i=0; i<attrNames.length; i++)
		{
			if(i!=0)
				jsonString += ',';
			jsonString += '"'+attrNames[i]+'"';
		}
		jsonString += '],"fieldValues":[';
		for(var i=0; i<attrValues.length; i++)
		{
			if(i!=0)
				jsonString += ',';
				
			if(attrNames[i].toUpperCase()=="ELEVATION")
				jsonString += '"'+$('#exBlockHeight').bootstrapSlider('getValue')+'"';
			else
				jsonString += '"'+attrValues[i]+'"';
		}
		
		jsonString += '],"type":"UPDATE"}';
		
		var dObject = {
			json: jsonString
		};
		
		$.ajax({
			url: host+'/iserver/PolygonEditing.jsp',
			data: dObject,
			dataType: "json",
			method: 'GET',		// POST not supproted for current version of jsp
			success: function (data) {                                  
				var state = data.state;
				if(state=='Success')
				{
					$('#txtSystemInfo').val("Update feature succeed");
					vectorLayer.removeAllFeatures();
					threeDGIS.threeDView.addBlockSelection();
					for(var i=0; i<thisObj.map.layers.length; i++)
					{
						if(thisObj.map.layers[i] instanceof SuperMap.Layer.TiledDynamicRESTLayer)
							thisObj.map.layers[i].redraw();
						$('#txtArea').html('');
						$('#txtGFA').html('');
						$('#txtHt').html('');
						$('#txtNoFloor').html('');
					}
				}
				else
					$('#txtSystemInfo').val("Update feature failed");
			},
			error: function(err) {
				alert("AJAX function failed");
				//console.log(err);
			}
		});
	}
	
	// Function to be called upon moving object
	TwoDView.prototype.onMove = function (feature,pixel) {
		this.feature = feature;
		
		var vertices = feature.geometry.getVertices();
		var height = Number($('#exBlockHeight').bootstrapSlider('getValue'));
		threeDGIS.threeDView.updateGeometry(vertices, height);
	}
}