function CoordTransform(/*x, y*/)
{
	// No non-static members yet
}

// Static fields
CoordTransform.gWGS84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
CoordTransform.gHK1980 = "+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs";

/*
 * Static functions
 */
// WGS 84 to HK Grid 1980
CoordTransform.wgs2hk = function(lng, lat) {
	return proj4(CoordTransform.gWGS84, CoordTransform.gHK1980, [lng, lat]);
}

CoordTransform.hk2wgs = function(x, y) {
	return proj4(CoordTransform.gHK1980, CoordTransform.gWGS84, [x, y]);
}