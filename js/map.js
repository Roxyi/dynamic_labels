/*jshint esversion: 6 */

mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZGFubWFwIiwiYSI6IjRUOVBuV28ifQ.ubu4SCJhADfVRbncXCXiPg';

// initial basemap
var map = new mapboxgl.Map({
    container: 'map',
    style: 'https://vectormaps.lavamap.com/vector_basemap_20180215/style_20180215.json',
    center: [-73.9576740104957, 40.7274924718489],
    zoom: 14
});

// set true to turn on tile boundaires for debugging
// map.showTileBoundaries = true;

var currentNeighborhood = "";
var hideDynamicLabels = false;

var nbhdCentroid = {};
nbhdCentroid.type = "FeatureCollection";
nbhdCentroid.features = [];

var nbhdAllCentroids = {};
nbhdAllCentroids.type = "FeatureCollection";
nbhdAllCentroids.features = [];

var polygonTest = {};
polygonTest.type = "FeatureCollection";
polygonTest.features = [];

var multiPolygonTest = {};
multiPolygonTest.type = "FeatureCollection";
multiPolygonTest.features = [];

var dynamicLabels = [];

dyLabels(map);

var dynamicLabeling = function() {
    nbhdAllCentroids.features = [];
    nbhdCentroid.features = [];
    polygonTest.features = [];
    var mapBounds = map.getBounds();
    var sw = map.getBounds()._sw;
    var ne = map.getBounds()._ne;
    var mapViewBound = turf.polygon([
        [
            [sw.lng, sw.lat],
            [sw.lng, ne.lat],
            [ne.lng, ne.lat],
            [ne.lng, sw.lat],
            [sw.lng, sw.lat]
        ]
    ]);

    var nbhdFeatures = map.queryRenderedFeatures({
        layers: ["nbhd"]
    });


    var groupNBHD = _.groupBy(nbhdFeatures, function(obj) {
        return obj.properties.small_neighborhood;
    });

    // var dynamicLabelFeatures = map.queryRenderedFeatures({
    //     layers: ["nbhd_centroids"]
    // });

    var labelFilter = ["!in", "small_neighborhood"];

    // if (dynamicLabelFeatures.length) {
    //     _.map(dynamicLabelFeatures, function(obj){
    //         if (obj.geometry.coordinates[0] > sw.lng && obj.geometry.coordinates[0] < ne.lng && obj.geometry.coordinates[1] > sw.lat && obj.geometry.coordinates[1] < ne.lat && obj.properties.small_neighborhood != currentNeighborhood) {
    //             nbhdCentroid.features.push(obj);
    //             delete groupNBHD[obj.properties.small_neighborhood];
    //             labelFilter.push(obj.properties.small_neighborhood);
    //         }
    //     });
    // }

    Object.keys(groupNBHD).forEach(function(e) {
        var maxlng = groupNBHD[e][0].properties.maxlng;
        var maxlat = groupNBHD[e][0].properties.maxlat;
        var minlng = groupNBHD[e][0].properties.minlng;
        var minlat = groupNBHD[e][0].properties.minlat;
        var nbhdCenterOfMassList = [];
        var lngOfCentroid = JSON.parse(groupNBHD[e][0].properties.centroid).coordinates[0];
        var latOfCentroid = JSON.parse(groupNBHD[e][0].properties.centroid).coordinates[1];
        if (lngOfCentroid > sw.lng && lngOfCentroid < ne.lng && latOfCentroid > sw.lat && latOfCentroid < ne.lat) {

        } else {
            // console.log(e);
            labelFilter.push(e);
            _.map(groupNBHD[e], function(obj) {
                // console.log(obj.geometry.coordinates[0]);
                // console.log(obj.geometry.coordinates[0].length);
                // console.log(obj.properties.small_neighborhood);
                // console.log(obj.geometry.type);
                var intersection;
                var centroid;
                var centerOfMass;
                if (obj.geometry.type == "Polygon") {
                    intersection = turf.intersect(mapViewBound, obj.geometry);
                    // console.log(intersection);
                    // centroid = turf.centroid(intersection.geometry);
                    if (intersection) {
                        polygonTest.features.push(intersection);
                        centerOfMass = turf.centerOfMass(intersection);
                        centerOfMass.properties.small_neighborhood = obj.properties.small_neighborhood;
                        centerOfMass.properties.minlng = minlng;
                        centerOfMass.properties.minlat = minlat;
                        centerOfMass.properties.maxlng = maxlng;
                        centerOfMass.properties.maxlat = maxlat;
                        // nbhdAllCentroids.features.push(centerOfMass);
                        nbhdCenterOfMassList.push(centerOfMass);
                    }
                }
                // else {
                //     obj.geometry.coordinates.forEach(function(coords) {
                //         var feat = {
                //             'type': 'Polygon',
                //             'coordinates': coords
                //         };
                //         intersection = turf.intersect(mapViewBound, feat);
                //         if (intersection) {
                //             multiPolygonTest.features.push(intersection);
                //             centerOfMass = turf.centerOfMass(intersection);
                //             centerOfMass.properties.name = obj.properties.small_neighborhood;
                //             nbhdAllCentroids.features.push(centerOfMass);
                //         }
                //     });
                // }
            });


            // var centroidsFeatureCollection = {};
            // centroidsFeatureCollection.type = "FeatureCollection";
            // centroidsFeatureCollection.features = centroids;
            //
            // var center = turf.center(centroidsFeatureCollection);
            // center.properties.name = nbhdName;
            // center.properties.minLng = minLng;
            // center.properties.minLat = minLat;
            // center.properties.maxLng = maxLng;
            // center.properties.maxLat = maxLat;
            // nbhdCentroid.features.push(center);
        }
        if (nbhdCenterOfMassList.length) {
            var nbhdCenterOfMass = {
                type: "FeatureCollection",
                features: nbhdCenterOfMassList
            };
            var legitCenter = turf.center(nbhdCenterOfMass);
            legitCenter.properties.small_neighborhood = nbhdCenterOfMassList[0].properties.small_neighborhood;
            legitCenter.properties.minlng = nbhdCenterOfMassList[0].properties.minlng;
            legitCenter.properties.minlat = nbhdCenterOfMassList[0].properties.minlat;
            legitCenter.properties.maxlng = nbhdCenterOfMassList[0].properties.maxlng;
            legitCenter.properties.maxlat = nbhdCenterOfMassList[0].properties.maxlat;
            nbhdCentroid.features.push(legitCenter);
        }
    });

    // console.log(nbhdCentroid);
    map.setFilter("nbhd_label", labelFilter);
    map.setFilter("fake_counts", labelFilter);
    // map.getSource('nbhdAllCentroids').setData(nbhdAllCentroids);
    // map.getSource('multiPolygonTest').setData(multiPolygonTest);
    // map.getSource('polygonTest').setData(polygonTest);
    // console.log(nbhdCentroid);
    map.getSource('nbhdCentroid').setData(nbhdCentroid);
};

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
        "id": "nbhd_hover_light",
        "type": "fill",
        "source": {
            type: 'vector',
            url: 'mapbox://jordanmap.6h12tv9x'
        },
        "source-layer": "nbhd_20180327-dgzidp",
        "paint": {
            "fill-color": "#666666",
            "fill-outline-color": "#fff",
            "fill-opacity": 0.5
        },
        "filter": ["==", "small_neighborhood", ""]
    });


    map.addLayer({
        "id": "nbhd_hover",
        "type": "fill",
        "source": {
            type: 'vector',
            url: 'mapbox://jordanmap.6h12tv9x'
        },
        "source-layer": "nbhd_20180327-dgzidp",
        "paint": {
            "fill-color": "#666666",
            "fill-outline-color": "#fff",
            "fill-opacity": 0.7
        },
        "filter": ["==", "small_neighborhood", ""]
    });

    map.addLayer({
        "id": "nbhd_outline",
        "type": "line",
        "source": {
            type: 'vector',
            url: 'mapbox://jordanmap.6h12tv9x'
        },
        "source-layer": "nbhd_20180327-dgzidp",
        "paint": {
            "line-color": "#fff",
            "line-width": 1
        }
    });

    // map.addSource('polygonTest', {
    //   type: 'geojson',
    //   data: polygonTest
    // });
    //
    // map.addLayer({
    //   "id": "polygon_outline",
    //   "type": "line",
    //   "source": "polygonTest",
    //   "paint": {
    //     "line-color": "#2a9e24",
    //     "line-width": 3
    //   }
    // });
    //
    // map.addSource('multiPolygonTest', {
    //   type: 'geojson',
    //   data: multiPolygonTest
    // });
    //
    // map.addLayer({
    //   "id": "multi_polygon_outline",
    //   "type": "line",
    //   "source": "multiPolygonTest",
    //   "paint": {
    //     "line-color": "#c0e024",
    //     "line-width": 3
    //   }
    // });

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
    //
    // map.addSource('nbhdAllCentroids', {
    //   type: 'geojson',
    //   data: nbhdAllCentroids
    // });
    //
    map.addLayer({
        "id": "nbhd_centroids",
        // "type": "circle",
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

    map.addLayer({
        "id": "fake_counts_centroids",
        // "type": "circle",
        "type": "symbol",
        "source": "nbhdCentroid",
        'minzoom': 12,
        "layout": {
            'icon-image': 'listingCircle0',
            'icon-size': 1,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-anchor': "top",
            'icon-offset': [0, 15],
            'text-field': "10",
            'text-font': ["Lato Bold"],
            'text-size': 15,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-anchor': "top",
            'text-offset': [-0.09, 1.75]
        },
        "paint": {
            'text-color': "#fff"
        }
    });

    map.addLayer({
        "id": "fake_counts",
        // "type": "circle",
        "type": "symbol",
        "source": {
            type: "vector",
            url: "mapbox://jordanmap.78891y1q"
        },
        "source-layer": "nbhd_label_20180323-73w8yn",
        'minzoom': 12,
        "layout": {
            'icon-image': 'listingCircle0',
            'icon-size': 1,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-anchor': "top",
            'icon-offset': [0, 15],
            'text-field': "10",
            'text-font': ["Lato Bold"],
            'text-size': 15,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-anchor': "top",
            'text-offset': [-0.09, 1.75]
        },
        "paint": {
            'text-color': "#fff"
        }
    });

    // map.addLayer({
    //   "id": "nbhd_all_centroids",
    //   // "type": "circle",
    //   "type": "symbol",
    //   "source": "nbhdAllCentroids",
    //   // "paint": {
    //   //     "circle-color": "#f00",
    //   //     "circle-radius": 5
    //   // }
    //   "layout": {
    //     'text-field': '{small_neighborhood}',
    //     'text-font': ["Lato Bold"],
    //     'text-size': 10,
    //     "text-padding": 3,
    //     "text-letter-spacing": 0.1,
    //     "text-max-width": 7,
    //     "text-transform": "uppercase"
    //   },
    //   "paint": {
    //     "text-color": "#333",
    //     "text-halo-color": "hsl(0, 0%, 100%)",
    //     "text-halo-width": 1.5,
    //     "text-halo-blur": 1
    //   }
    // });

    // var tileLoad = setInterval(function() {
    //   if (map.loaded()) {
    //     dynamicLabeling();
    //     clearInterval(tileLoad)
    //   }
    // }, 300);

    map.on('click', function(e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ["nbhd_centroids", "nbhd_label", "nbhd"]
        });
        if (features.length) {
            map.setFilter("nbhd_hover_light", ["!=", "small_neighborhood", features[0].properties.small_neighborhood]);
            map.setFilter("nbhd_hover", ["==", "small_neighborhood", ""]);
            currentNeighborhood = features[0].properties.small_neighborhood;
            map.fitBounds([
                [features[0].properties.minlng, features[0].properties.minlat],
                [features[0].properties.maxlng, features[0].properties.maxlat]
            ]);
        }
        var tileLoad = setInterval(function() {
            if (map.loaded()) {
                dynamicLabeling();
                clearInterval(tileLoad);
            }
        }, 300);
    });

    // get features every time the map is moved
    // map.on('moveend', function() {
    //     if (dynamic) {
    //         var tileLoad = setInterval(function() {
    //             if (map.loaded()) {
    //                 dynamicLabeling();
    //                 clearInterval(tileLoad);
    //             }
    //         }, 300);
    //     }
    // });

    map.on('mousemove', function(e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ["nbhd_centroids", "nbhd_label", "nbhd"]
        });

        if (features.length) {
            if (features[0].properties.small_neighborhood != currentNeighborhood) {
                map.getCanvas().style.cursor = 'pointer';
                map.setFilter("nbhd_hover", ["==", "small_neighborhood", features[0].properties.small_neighborhood]);
            }
        } else {
            map.getCanvas().style.cursor = '';
            map.setFilter("nbhd_hover", ["==", "small_neighborhood", ""]);
        }
    });
});
