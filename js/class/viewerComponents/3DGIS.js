function ThreeDGIS(threeDView, twoDView, streetview, panoview)
{
	// Private fields pre-defined
	var _threeDView = threeDView;
	var _twoDView = twoDView;
	var _streetview = streetview;
	var _panoview = panoview;
	var _mode = '3D';
	
	// Public field
	this.threeDView = threeDView;
	this.twoDView = twoDView;
	this.streetview = streetview;
	this.panoview = panoview;
	this.mode = ['3D'];		// Make this array to handle split view mode
	this.isSplit = false;
	
	/*
	 * Private functions
	 */
	// Init 2D map
	var init2DMap = function(thisObj) {
		var treeLayer, buildingLayer, podiumLayer, DOPLayer;
		var treeURL = host+"/iserver/services/map-PlanD_Phase1/rest/maps/Tree";
		var buildingURL = host+"/iserver/services/map-PlanD_Phase1/rest/maps/Building";
		var podiumURL = host+"/iserver/services/map-PlanD_Phase1/rest/maps/Podium";
		var DOPURL = host+"/iserver/services/map-PlanD_Phase1/rest/maps/DOP";
		var mapURL = host+"/iserver/services/map-PlanD_Phase1/rest/maps/EditingSQL";
		
		var map = new SuperMap.Map("SMapContainer", {controls: [
			new SuperMap.Control.Navigation({
				dragPanOptions: {
					enableKinetic: true
				}
			})
		],
			allOverlays: true
		});
		var panzoombar=new SuperMap.Control.PanZoomBar();
		panzoombar.showSlider=false;
		map.addControl(panzoombar);
		_twoDView.initMap(map);
		
		// Following two lines not working upon initialization
		panzoombar.getDoms().zoomIn.style.display = 'none';
		panzoombar.getDoms().zoomOut.style.display = 'none';
		
		//_twoDView.addLayer('editor', mapURL);
		//DOPLayer = new SuperMap.Layer.TiledDynamicRESTLayer("editor", mapURL, {transparent: true, cacheEnabled: false}, {maxResolution:"auto",bufferImgCount:0});
		//DOPLayer.events.on({"layerInitialized": addLayerDOP});
		
		_twoDView.addLayer("editor",mapURL);
		
		function addLayerDOP(){
			map.addLayers([DOPLayer]);
			map.setCenter(new SuperMap.LonLat(834611.23, 815470.0), 1);
			
			// _twoDView.initDraw();
		}
		
		// _twoDView.addLayer('HK Map', host+'/iserver/services/map-PlanD_Phase1/rest/maps/Map');
		
		/*DOPLayer = new SuperMap.Layer.TiledDynamicRESTLayer("DOP", DOPURL, {transparent: true, cacheEnabled: true});
		DOPLayer.events.on({"layerInitialized": addLayerDOP});
		
		function addLayerDOP(){
			podiumLayer = new SuperMap.Layer.TiledDynamicRESTLayer("Podium", podiumURL, {transparent: true, cacheEnabled: true});
			podiumLayer.events.on({"layerInitialized": addLayerPodium});
		}
		function addLayerPodium(){
			buildingLayer = new SuperMap.Layer.TiledDynamicRESTLayer("Building", buildingURL, {transparent: true, cacheEnabled: true});
			buildingLayer.events.on({"layerInitialized": addLayerBuilding});
		}
		function addLayerBuilding(){
			treeLayer = new SuperMap.Layer.TiledDynamicRESTLayer("Tree", treeURL, {transparent: true, cacheEnabled: true});
			treeLayer.events.on({"layerInitialized": addLayers});
		}
		function addLayers(){
			map.addLayers([DOPLayer,podiumLayer,buildingLayer,treeLayer]);
			map.setCenter(new SuperMap.LonLat(835000, 816000), 1);
		}
		*/
	}
	
	/*
	 * Public functions
	 */
	// Toggle between 2D and 3D
	ThreeDGIS.prototype.toggle23D = function() {
		if(this.mode[0]=='3D' && this.mode.length==1)	// Switch from 3D to 2D
		{
			// Change visibility of map div
			_twoDView.mapDiv.css('display','block');
			_twoDView.mapDiv.css('width','100%');
			_twoDView.mapDiv.css('left','0px');
			_threeDView.mapDiv.css('display','none');
		
			// Change visibility of toolset
			_threeDView.toolDiv.css('display','none');
			_twoDView.toolDiv.css('display','block');
			
			// Change visibility of layer manager
			// Something like hardcode
			$('#3DLayers').css('display','none');
			$('#2DLayers').css('display','block');
			
			this.mode = ['2D'];
		}
		else		// Switch from 2D to 3D
		{
			// Change visibility of map div
			_threeDView.mapDiv.css('display','block');
			_threeDView.mapDiv.css('width','100%');
			_threeDView.mapDiv.css('left','0px');
			_twoDView.mapDiv.css('display','none');
		
			// Change visibility of toolset
			_twoDView.toolDiv.css('display','none');
			_threeDView.toolDiv.css('display','block');
			
			// Change visibility of layer manager
			// Something like hardcode
			$('#2DLayers').css('display','none');
			$('#3DLayers').css('display','block');
			
			this.mode = ['3D'];
		}
		
		// Check whether 2D map component has been defined
		var isMapDefined = true;
		if(_twoDView.map != undefined)
		{
			if(_twoDView.map == null)
				isMapDefined = false;
		}
		else
			isMapDefined = false;
			
		if(!isMapDefined)
		{
			init2DMap(this);
		}
		this.isSplit = false;
	}
	
	// Split screec of 2/3D
	ThreeDGIS.prototype.split23D = function() {
		this.mode = ['2D', '3D'];
		
		_threeDView.mapDiv.css('display','block');
		_threeDView.mapDiv.css('width','50%');
		_threeDView.mapDiv.css('left','50%');
		
		_twoDView.mapDiv.css('display','block');
		_twoDView.mapDiv.css('width','50%');
		_twoDView.mapDiv.css('left','0px');
		
		this.isSplit = true;
		
		var isMapDefined = true;
		if(_twoDView.map != undefined)
		{
			if(_twoDView.map == null)
				isMapDefined = false;
		}
		else
			isMapDefined = false;
			
		if(!isMapDefined)
			init2DMap(this);
	}
	
	// Toggle between bird-eye and human-eye view mode in 3D
	ThreeDGIS.prototype.toggleViewMode3D = function() {
		if(this.mode[0]=='3D' && this.mode.length==1)
			_threeDView.toggleViewMode();
	}
	
	/*
	 * Properties
	 */
	// Get Cesium 3d viewer
	Object.defineProperty(this, "viewer3D",
    {
        get: function () { return this.threeDView.viewer; }
    });
}