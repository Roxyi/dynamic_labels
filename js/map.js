mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZGFubWFwIiwiYSI6IjRUOVBuV28ifQ.ubu4SCJhADfVRbncXCXiPg';

// initial basemap
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jordanmap/cjfndkntp1v4w2spazxnvdbxm',
    center: [-73.9576740104957, 40.7274924718489],
    zoom: 14
});

// set true to turn on tile boundaires for debugging
// map.showTileBoundaries = true;

var nbhdCentroid = {};
nbhdCentroid.type = "FeatureCollection";
nbhdCentroid.features = [];

map.on('load', function() {

    map.addSource("nbhdSourceData", {
        type: "vector",
        url: "mapbox://jordanmap.6h12tv9x"
    });

    // add neighborhood layer
    map.addLayer({
        "id": "nbhd",
        "type": "fill",
        "source": "nbhdSourceData",
        "source-layer": "nbhd_20180327-dgzidp",
        "paint": {
            "fill-color": "transparent"
        }
    });

    map.addLayer({
        "id": "nbhd_outline",
        "type": "line",
        "source": "nbhdSourceData",
        "source-layer": "nbhd_20180327-dgzidp",
        "paint": {
            "line-color": "#000",
            "line-width": 3
        }
    });

    map.addLayer({
        "id": "nbhd_label",
        "type": "symbol",
        "source": {
            type: "vector",
            url: "mapbox://jordanmap.byu32psd"
        },
        "source-layer": "nbhd_label_20180327-2e9xr0",
        "layout": {
            'text-field': '{small_neighborhood}',
            'text-font': ["Lato Bold"],
            'text-size': {
                "base": 1,
                "stops": [
                    [12, 12],
                    [16, 16]
                ]
            },
            "text-padding": 3,
            "text-letter-spacing": 0.1,
            "text-max-width": 7,
            "text-transform": "uppercase"
        },
        "paint": {
            "text-color": "#333",
            "text-halo-color": "hsl(0, 0%, 100%)",
            "text-halo-width": 1.5,
            "text-halo-blur": 1
        }
    });

    map.addSource('nbhdCentroid', {
        type: 'geojson',
        data: nbhdCentroid
    });

    map.addLayer({
        "id": "nbhd_centroids",
        "type": "symbol",
        "source": "nbhdCentroid",
        "layout": {
            'text-field': '{small_neighborhood}',
            'text-font': ["Lato Bold"],
            'text-size': {
                "base": 1,
                "stops": [
                    [12, 12],
                    [16, 16]
                ]
            },
            "text-padding": 3,
            "text-letter-spacing": 0.1,
            "text-max-width": 7,
            "text-transform": "uppercase",
            "text-allow-overlap": true
        },
        "paint": {
            "text-color": "#333",
            "text-halo-color": "hsl(0, 0%, 100%)",
            "text-halo-width": 1.5,
            "text-halo-blur": 1
        }
    });

    map.on('moveend', function(e) {
      var tileLoad = setInterval(function() {
          if (map.loaded()) {
              dyLabels(map);
              clearInterval(tileLoad);
          }
      }, 300);
    });
});

function dyLabels(map) {
    nbhdCentroid.features = [];
    var nbhdFeatures = map.queryRenderedFeatures({
        layers: ["nbhd"]
    });

    var mapSW = map.getBounds()._sw;
    var mapNE = map.getBounds()._ne;

    var mapViewBound = {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [
                [
                    [mapSW.lng, mapSW.lat],
                    [mapSW.lng, mapNE.lat],
                    [mapNE.lng, mapNE.lat],
                    [mapNE.lng, mapSW.lat],
                    [mapSW.lng, mapSW.lat]
                ]
            ]
        }
    };

    var visualCenterList = [];

    var fixedLabelFilter = ["!in", "small_neighborhood"];

    var neighborhoods = groupBy(nbhdFeatures, nbhdFeature => nbhdFeature.properties.small_neighborhood);
    neighborhoods.forEach(function(value, key) {
        var lngOfCentroid = JSON.parse(value[0].properties.centroid).coordinates[0];
        var latOfCentroid = JSON.parse(value[0].properties.centroid).coordinates[1];
        if (lngOfCentroid <= mapSW.lng || lngOfCentroid >= mapNE.lng || latOfCentroid <= mapSW.lat || latOfCentroid >= mapNE.lat) {
            fixedLabelFilter.push(key);
            // console.log(key);
            // console.log(key,value);
            var visualCenter = value.map(obj => getVisualCenter(obj, mapViewBound));
            if (visualCenter.clean().length) {
                visualCenterList.push(visualCenter.clean());
            }
        }
    });
    visualCenterList.map(obj => {
        var coordinatesList = [];
        obj.forEach(function(feature){
            coordinatesList.push(feature.geometry.coordinates);
        });
        var center = getCenter(coordinatesList);
        var neighborhoodCenterFeature = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: center
            },
            properties: {
                small_neighborhood: obj[0].properties.small_neighborhood,
                minlng: obj[0].properties.minlng,
                minlat: obj[0].properties.minlat,
                maxlng: obj[0].properties.maxlng,
                maxlat: obj[0].propertiesmaxlat
            }
        };
        nbhdCentroid.features.push(neighborhoodCenterFeature);
    });
    map.setFilter("nbhd_label", fixedLabelFilter);
    map.getSource('nbhdCentroid').setData(nbhdCentroid);
}
//
// groupBy function
function groupBy(list, keyGetter) {
    var map = new Map();
    list.forEach(function(item) {
        var key = keyGetter(item);
        var collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}

// get visual center
function getVisualCenter(feature, mapViewBound) {
    if (feature.geometry.type == "Polygon") {
        var intersection = turf.intersect(mapViewBound, feature.geometry);
        if (intersection) {
            var visualCenter = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: []
                },
                properties: {}
            };
            if(intersection.geometry.coordinates.length > 1) {
                var intersections = [];
                intersection.geometry.coordinates.forEach(function(coordinate){
                    intersections.push(polylabel(coordinate));
                });
                visualCenter.geometry.coordinates = getCenter(intersections);
            } else {
                visualCenter.geometry.coordinates = polylabel(intersection.geometry.coordinates);
            }
            visualCenter.properties.small_neighborhood = feature.properties.small_neighborhood;
            visualCenter.properties.minlng = feature.properties.minlng;
            visualCenter.properties.minlat = feature.properties.minlat;
            visualCenter.properties.maxlng = feature.properties.maxlng;
            visualCenter.properties.maxlat = feature.properties.maxlat;
            return visualCenter;
        }
    }
}

// get the center of a coordinates list
function getCenter(coordinates) {
    var lngList = [];
    var latList = [];
    coordinates.map(coordinate => {
        lngList.push(coordinate[0]);
        latList.push(coordinate[1]);
    });
    var meanLng = lngList.reduce((p,c) => p + c, 0) / lngList.length;
    var meanLat = latList.reduce((p,c) => p + c, 0) / latList.length;
    return [meanLng, meanLat];
}

// remove undefined from an array
Array.prototype.clean = function() {
  for (var i = 0; i < this.length; i++) {
    if (!this[i]) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
