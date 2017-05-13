function ThreeDBlock(options)
{
	// Private fields pre-defined
	var _vertices = options.vertices;
	var _bH = options.baseHeight;
	var _eH = options.extrudeHeight;
	var _v = options.viewer;
	
	var _entity;	// The cesium entity object
	var _id;		// ID of the entity to be added into the 3D view
	
	// Public fields pre-defined
	this.vertices = options.vertices;
	this.baseHeight = options.baseHeight;
	this.extrudeHeight = options.extrudeHeight;
	this.viewer = options.viewer;
	this.name = options.blockName;
	this.id = options.id;
	
	/*
	 * Private functions
	 */
	// Make an entity ID based on the block name
	var makeID = function(thisObj) {
		var id = 'BLOCK_'+thisObj.id;
		var entity = thisObj.viewer.entities.getById(id);

		if(entity!=undefined)
		{
			var num = 0;
			while(true)
			{
				entity = thisObj.viewer.entities.getById('BLOCK_'+thisObj.id + num);
				if(entity==undefined)
				{
					id = 'BLOCK_'+thisObj.id+num;
					break;
				}
				else
					num++;
			}
		}
		
		return id;
	}
	
	/*
	 * Public functions
	 */
	// Add this object onto cesium
	ThreeDBlock.prototype.add = function() {
		if(_entity!=undefined)
			this.viewer.entities.add(_entity);
		else
		{
			if(this.baseHeight==undefined)	// If base height not specified, find the lowest point as the base height
			{
				this.baseHeight = 9999;
				
				for(var i=0; i<this.vertices.length; i++)
				{
					var cartoPos = Cesium.Cartographic.fromCartesian(this.vertices[i]);
					var height = cartoPos.height;
					var terrainHeight = this.viewer.scene.globe.getHeight(cartoPos);
					if(terrainHeight>height)
						height = terrainHeight;
					
					if(height<this.baseHeight)
						this.baseHeight = height;
				}
			}
			
			var polygon = new Cesium.PolygonGraphics({
				hierarchy: new Cesium.PolygonHierarchy(this.vertices),
				extrudedHeight: this.extrudeHeight+this.baseHeight,
				height: this.baseHeight
			});
			
			var id = makeID(this);
			_entity = this.viewer.entities.add({
				name: this.name,
				id: id,
				polygon: polygon,
				outline: true,
				shadows: Cesium.ShadowMode.ENABLED		// Does not seem to be working
			});
		}
	}
	
	// Initialization after construction
	this.add();
}