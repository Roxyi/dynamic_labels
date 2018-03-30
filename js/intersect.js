// depend on jsts for now https://github.com/bjornharrtell/jsts/blob/master/examples/overlay.html
var jsts = require('jsts');

module.exports = function(poly1, poly2) {
  var geom1, geom2;
  if(poly1.type === 'Feature') geom1 = poly1.geometry;
  else geom1 = poly1;
  if(poly2.type === 'Feature') geom2 = poly2.geometry;
  else geom2 = poly2;
  var reader = new jsts.io.GeoJSONReader();
  var a = reader.read(JSON.stringify(geom1));
  var b = reader.read(JSON.stringify(geom2));
  var intersection = a.intersection(b);
  var parser = new jsts.io.GeoJSONParser();

  intersection = parser.write(intersection);
  if(intersection.type === 'GeometryCollection' && intersection.geometries.length === 0) {
    return undefined;
  } else {
    return {
      type: 'Feature',
      properties: {},
      geometry: intersection
    };
  }
};
