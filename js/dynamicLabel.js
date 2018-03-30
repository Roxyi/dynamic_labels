/*jshint esversion: 6 */

mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZGFubWFwIiwiYSI6IjRUOVBuV28ifQ.ubu4SCJhADfVRbncXCXiPg';

// initial basemap
const map = new mapboxgl.Map({
    container: 'map',
    // style: 'https://vectormaps.lavamap.com/vector_basemap_20180215/style_20180215.json',
    style: 'mapbox://styles/jordanmap/cjajsy6x7b46k2rpatcsm0mu1',
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
            url: "mapbox://jordanmap.byu32psd"
        },
        "source-layer": "nbhd_label_20180327-2e9xr0",
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
                // console.log("Start the dynamic labeling function");
                dyLabels(map);
                clearInterval(tileLoad);
            }
        }, 300);
    });

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

function dyLabels(map) {
    nbhdCentroid.features = [];
    let nbhdFeatures = map.queryRenderedFeatures({
        layers: ["nbhd"]
    });

    let mapSW = map.getBounds()._sw;
    let mapNE = map.getBounds()._ne;

    let centroidsList = [];

    let fixedLabelFilter = ["!in", "small_neighborhood"];

    let neighborhoods = groupBy(nbhdFeatures, nbhdFeature => nbhdFeature.properties.small_neighborhood);
    neighborhoods.forEach(function(value, key) {
        let lngOfCentroid = JSON.parse(value[0].properties.centroid).coordinates[0];
        let latOfCentroid = JSON.parse(value[0].properties.centroid).coordinates[1];
        if (lngOfCentroid <= mapSW.lng || lngOfCentroid >= mapNE.lng || latOfCentroid <= mapSW.lat || latOfCentroid >= mapNE.lat) {
            fixedLabelFilter.push(key);
            // console.log(key);
            // console.log(key,value);
            let polyInMap = value.map(obj => getPolyInMap(obj, mapSW, mapNE));
            // console.log(intersections.clean());
            // let centerOfMass = intersections.clean().map(obj => getCenterOfMass(obj));
            // // console.log(centerOfMass.clean());
            // if (centerOfMass.clean().length) {
            //     let centerFeatures = {
            //         type: "FeatureCollection",
            //         features: centerOfMass.clean()
            //     };
            //     let centerOfCentroids = center(centerFeatures);
            //     centerOfCentroids.properties.small_neighborhood = key;
            //     centerOfCentroids.properties.maxlng = value[0].properties.maxlng;
            //     centerOfCentroids.properties.maxlat = value[0].properties.maxlat;
            //     centerOfCentroids.properties.minlng = value[0].properties.minlng;
            //     centerOfCentroids.properties.minlat = value[0].properties.minlat;
            //     // console.log(center);
            //     nbhdCentroid.features.push(centerOfCentroids);
            // }
        }
    });
    map.setFilter("nbhd_label", fixedLabelFilter);
    map.setFilter("fake_counts", fixedLabelFilter);
    map.getSource('nbhdCentroid').setData(nbhdCentroid);
}

// groupBy function
function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}

// get intersection
function getPolyInMap(feature, sw, ne) {
    console.log(feature);
    if (feature.geometry.type == "Polygon") {
        for (var i = 0; i < feature.geometry.coordinates[0].length; i++) {
            let lng = feature.geometry.coordinates[0][i][0];
            let lat = feature.geometry.coordinates[0][i][1];
            if (lng <= sw.lng || lng >= ne.lng || lat <= sw.lat || lat >= ne.lat) {
                feature.geometry.coordinates[0].splice(i,1);
            }
            feature.geometry.coordinates[0].push(feature.geometry.coordinates[0][feature.geometry.coordinates[0].length - 1]);
        }
        // console.log(feature.geometry.coordinates[0]);
    } else if (feature.geometry.type == "MultiPolygon") {

    }
}

// get center of mass
function getCenterOfMass(feature) {
    if (feature.geometry.type == "Polygon") {
        let polyCentroid = centerOfMass(feature);
        return polyCentroid;
    } else if (feature.geometry.type == "MultiPolygon") {
        let polyCentroids = {
            type: "FeatureCollection",
            features: []
        };
        feature.geometry.coordinates.forEach(function(coord){
            // let poly = polygon(coord);
            // let mapViewBound = {
            //     type: "Feature",
            //     geometry: {
            //         type: "Polygon",
            //         coordinates: [
            //             [
            //                 [mapSW.lng, mapSW.lat],
            //                 [mapSW.lng, mapNE.lat],
            //                 [mapNE.lng, mapNE.lat],
            //                 [mapNE.lng, mapSW.lat],
            //                 [mapSW.lng, mapSW.lat]
            //             ]
            //         ]
            //     }
            // };
            let polyCentroid = centerOfMass(poly);
            polyCentroids.features.push(polyCentroid);
        });
        let multiPolyCentroid = center(polyCentroids);
        return multiPolyCentroid;
    } else {
        return;
    }
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
