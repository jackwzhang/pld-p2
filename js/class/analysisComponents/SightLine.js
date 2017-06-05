function SightLine(scene)
{
	// private fields pre-defined
	var _startPoint;
	var _endPoint = [];
	var _lineOfSight = new Cesium.Sightline(scene);
	
	/*
	 * public functions
	 */
	// Add point for the line of sight
	// If not yet have observe/start point, regard input as observe/start point
	// Otherwise, add as a target point
	SightLine.prototype.addPoint = function(cartoPoint) {
		// If not yet have initiated starting point
		if(_startPoint==undefined)
		{
			_startPoint = cartoPoint;
			_lineOfSight.viewPosition = [cartoPoint.longitude*180/Math.PI, cartoPoint.latitude*180/Math.PI, cartoPoint.height];
		}
		else
		{
			_endPoint.push(cartoPoint);
			_lineOfSight.addTargetPoint({
				position : [cartoPoint.longitude*180/Math.PI, cartoPoint.latitude*180/Math.PI, cartoPoint.height],
				name : "point" + _endPoint.length
			});
		}
	}
	
	// Clear line of sight
	SightLine.prototype.clear = function() {
		_lineOfSight.removeAllTargetPoint();
		_startPoint = undefined;
		_endPoint = [];
	}
	
	/*
	 * Implementation upon initialization
	 */
	_lineOfSight.build();
}