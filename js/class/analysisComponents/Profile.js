function Profile(viewer, terrainSpatialAnalyURL)
{
	// Private function
	var _scene = viewer.scene;
	var _profile3D = new Cesium.Profile(_scene);
	var _terrainURL = terrainSpatialAnalyURL;
	
	var _handlerLineTerrain = new Cesium.DrawHandler(viewer,Cesium.DrawMode.Line,1);
	var _handlerLineObject = new Cesium.DrawHandler(viewer,Cesium.DrawMode.Line,2);
	
	// Initialize chart UI, may not include this here
	var _myChart = echarts.init(document.getElementById('chart'));
	
	/*
	 * Private functions
	 */
	// Deactivate profile drawing
	var _deactiveProfile = function() {
		_handlerLineTerrain.deactivate();
		_handlerLineObject.deactivate();
	}
	
	// Build the profile result
	var _addResultLayer = function(mode, resultObject) {
		if(!resultObject){
			alert('No profile line plot!');
			return ;
		}
		var line = CesiumToSuperMap.convertPolyline(Cesium,SuperMap,resultObject);
		// var profileUrl = 'http://pld-3dappdev.pland.hksarg/iserver/services/spatialAnalysis-PlanD_Phase1/restjsr/spatialanalyst/datasets/DTM_2@data/terraincalculation/profile.jsonp?returnContent=true';
		var points = [];
		var vertices = line.getVertices();
		
		for(var i=0; i<vertices.length; i++)
		{
			var hkpt = CoordTransform.wgs2hk(vertices[i].x, vertices[i].y);
			points.push(new SuperMap.Geometry.Point(hkpt[0], hkpt[1]));
		}
		// points.push(new SuperMap.Geometry.Point(line.getVertices()[0].x, line.getVertices()[0].y));
		// points.push(new SuperMap.Geometry.Point(line.getVertices()[1].x, line.getVertices()[1].y));
		
		if(mode=='2D')
		{
			var serverGeometry = new SuperMap.REST.ServerGeometry({
				id : 0,//???number??
				style : null,
				parts : [points.length],
				type : 'LINE',
				points : points,
				prjCoordSys : null
			});
			SuperMap.Util.committer({
				method : 'POST',
				url : _terrainURL,
				data : {
					line : serverGeometry,
					resampleTolerance : '0.5'
				},
				success : function(args){
					_buildProfile(args);
					threeDGIS.writeInfo('Profile analysis finished');
				},
				failure : function(err){
					console.log(err);
				}
			});
		}
		else
		{
			_profile3D.startPoint = [vertices[0].x, vertices[0].y, 0];
			_profile3D.endPoint = [vertices[1].x, vertices[1].y, 0];
			
			_profile3D.getBuffer(function(buffer) {
				var canvas = document.getElementById("profileImg");
				canvas.height = _profile3D._textureHeight;
				canvas.width = _profile3D._textureWidth;
				var ctx = canvas.getContext("2d");
				var imgData = ctx.createImageData(_profile3D._textureWidth, _profile3D._textureHeight);

				imgData.data.set(buffer);
				//ÔÚcanvasÉÏ»æÖÆÍ¼Æ¬
				ctx.putImageData(imgData,0,0);
			});

			_profile3D.build();
			$('#profileOSGBModal').modal({
				backdrop: 'static',
				keyboard: false
			});
		}
	}
	
	// Draw terrain profile on chart
	var _buildProfile = function(result){
		var profileRes = result.profile[0];
		var xyCoord = result.xyCoordinate[0];
		if(!profileRes || !xyCoord){
			return ;
		}
		var xMax = 0,yMax = 0;
		var points = profileRes.points;
		var xyCoordPoints = xyCoord.points;
		var arr = [];
		for(var i = 0,j = points.length;i < j;i++){
			var x = points[i].x;
			var y = points[i].y;
			var lon = xyCoordPoints[i].x;
			var lat = xyCoordPoints[i].y;
			arr.push([x,y,lon,lat]);
			xMax = x > xMax ? x : xMax;
			yMax = y > yMax ? y : yMax;
		}
		_myChart.clear();
		_myChart.setOption({
			title : {
				text : 'Profile Analysis'
			},
			tooltip: {
				trigger: 'axis',
				formatter: function (params) {
					var param = params[0];
					var x = param.data[0];
					var y = param.data[1];
					var lon = param.data[2];
					var lat = param.data[3];
					return 'x : ' + lon.toFixed(3) + '</br>' + 'y : ' + lat.toFixed(3) + '</br>' + 'z : ' + y;
				},
				axisPointer: {
					animation: false
				}
			},
			toolbox: {
				feature: {
					saveAsImage: {},
					myTool1 : {
						show : true,
						title : 'Close',
						icon : 'path://M432.45,595.444c0,2.177-4.661,6.82-11.305,6.82c-6.475,0-11.306-4.567-11.306-6.82s4.852-6.812,11.306-6.812C427.841,588.632,432.452,593.191,432.45,595.444L432.45,595.444z M421.155,589.876c-3.009,0-5.448,2.495-5.448,5.572s2.439,5.572,5.448,5.572c3.01,0,5.449-2.495,5.449-5.572C426.604,592.371,424.165,589.876,421.155,589.876L421.155,589.876z M421.146,591.891c-1.916,0-3.47,1.589-3.47,3.549c0,1.959,1.554,3.548,3.47,3.548s3.469-1.589,3.469-3.548C424.614,593.479,423.062,591.891,421.146,591.891L421.146,591.891zM421.146,591.891',
						onclick : function(){
							$('#chart').hide();
						}
					}
				}
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				containLabel: true
			},
			xAxis : {
				min : 0,
				max : Number((xMax*1.2).toFixed(3)),
				type : 'value'
			},
			yAxis : {
				type : 'value',
				min : 0,
				max : Number((yMax*1.2).toFixed(3))
			},
			series : [{
				type : 'line',
				data : arr,
				showSymbol: false,
				color : 'green'
			}],
			backgroundColor : 'white',
			color : '#c23531'
		});
		$('#chart').show();
	}
	
	/*
	 * Public functions
	 */
	// Start profile analysis on terrain
	Profile.prototype.doProfile2D = function() {
		_deactiveProfile();
		this.clear();
		_handlerLineTerrain.activate();
	}
	
	// Start profile analysis on S3M layer
	Profile.prototype.doProfile3D = function() {
		_deactiveProfile();
		this.clear();
		_handlerLineObject.activate();
	}
	
	// Clear profile line from the scene
	Profile.prototype.clear = function() {
		_handlerLineTerrain.clear();
		_handlerLineObject.clear();
	}
	
	// Implementation after initialization
	// Draw 2D profile finish event
	_handlerLineTerrain.drawEvt.addEventListener(function(result){
		resultObject = result.object;
		_addResultLayer('2D', resultObject);
	});
	
	// Draw 3D profile finish event
	_handlerLineObject.drawEvt.addEventListener(function(result){
		resultObject = result.object;
		_addResultLayer('3D', resultObject);
	});
}