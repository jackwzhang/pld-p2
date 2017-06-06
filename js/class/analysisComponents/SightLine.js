function SightLine(scene)
{
	// Private fields pre-defined
	var _startPoint;
	var _endPoint = [];
	var _lineOfSight = new Cesium.Sightline(scene);
	
	// Object properties
	Object.defineProperty(this, "pointCount",
    {
        get: function () { 
			if(_startPoint!=undefined)
				return _endPoint.length+1;
			else
				return 0;
		}
    });
	
	/*
	 * Public functions
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
			_lineOfSight.build();
		}
	}
	
	// Remove the last target point
	SightLine.prototype.removeLastTargetPoint = function() {
		if(_endPoint.length==0)
			return false;
		
		var targetCount = _endPoint.length;
		var notify = _lineOfSight.removeTargetPoint('point'+targetCount);
		if(notify)
			_endPoint.pop();
		return notify;
	}
	
	// Clear line of sight
	SightLine.prototype.clear = function() {
		if(_startPoint!=undefined)
		{
			_lineOfSight.removeAllTargetPoint();
			_startPoint = undefined;
			_endPoint = [];
		}
	}
	
	/*
	 * Implementation upon initialization
	 */
	_lineOfSight.build();
}