// An example Earth Engine script for visualizing the path of the August 2017
// solar eclipse and likely cloud cover using MODIS data.

// To keep this script self-contained, I've hard-coded a polygon outlining the
// path of totality.  The data is from NASA here:
// https://eclipse.gsfc.nasa.gov/SEpath/SEpath2001/SE2017Aug21Tpath.html
var pathOfTotality = ee.Geometry.Polygon([[
  [-164.505, 41.495], [-156.936667, 42.855], [-152.105, 43.593333],
  [-148.256667, 44.1], [-144.965, 44.471667], [-142.046667, 44.751667],
  [-139.4, 44.963333], [-136.963333, 45.12], [-134.695, 45.233333],
  [-132.568333, 45.308333], [-130.56, 45.35], [-128.655, 45.365],
  [-126.84, 45.355], [-125.105, 45.321667], [-123.441667, 45.27],
  [-121.843333, 45.198333], [-120.305, 45.11], [-118.82, 45.006667],
  [-117.385, 44.888333], [-115.996667, 44.755], [-114.65, 44.611667],
  [-113.345, 44.455], [-112.076667, 44.288333], [-110.841667, 44.11],
  [-109.641667, 43.923333], [-108.471667, 43.726667], [-107.331667, 43.521667],
  [-106.218333, 43.306667], [-105.131667, 43.085], [-104.07, 42.855],
  [-103.031667, 42.618333], [-102.015, 42.375], [-101.02, 42.123333],
  [-100.043333, 41.866667], [-99.086667, 41.603333], [-98.148333, 41.333333],
  [-97.226667, 41.058333], [-96.321667, 40.776667], [-95.431667, 40.49],
  [-94.555, 40.198333], [-93.693333, 39.901667], [-92.843333, 39.598333],
  [-92.006667, 39.291667], [-91.181667, 38.98], [-90.366667, 38.663333],
  [-89.561667, 38.341667], [-88.766667, 38.015], [-87.98, 37.685],
  [-87.201667, 37.35], [-86.431667, 37.011667], [-85.666667, 36.668333],
  [-84.91, 36.32], [-84.156667, 35.968333], [-83.41, 35.611667],
  [-82.666667, 35.251667], [-81.926667, 34.886667], [-81.19, 34.518333],
  [-80.456667, 34.145], [-79.723333, 33.766667], [-78.991667, 33.385],
  [-78.26, 32.998333], [-77.528333, 32.608333], [-76.795, 32.211667],
  [-76.06, 31.811667], [-75.323333, 31.408333], [-74.581667, 30.998333],
  [-73.835, 30.585], [-73.083333, 30.165], [-72.325, 29.74],
  [-71.56, 29.311667], [-70.785, 28.875], [-70.001667, 28.435],
  [-69.205, 27.986667], [-68.398333, 27.533333], [-67.575, 27.073333],
  [-66.736667, 26.606667], [-65.88, 26.133333], [-65.003333, 25.65],
  [-64.103333, 25.16], [-63.178333, 24.661667], [-62.225, 24.151667],
  [-61.24, 23.633333], [-60.218333, 23.101667], [-59.155, 22.558333],
  [-58.045, 22.001667], [-56.88, 21.43], [-55.651667, 20.84],
  [-54.35, 20.231667], [-52.958333, 19.6], [-51.46, 18.94],
  [-49.828333, 18.246667], [-48.023333, 17.513333], [-45.99, 16.725],
  [-43.626667, 15.86], [-40.74, 14.876667], [-36.81, 13.66],
  [-38.466667, 13.476667], [-42.078333, 14.586667], [-44.826667, 15.511667],
  [-47.108333, 16.333333], [-49.09, 17.088333], [-50.856667, 17.793333],
  [-52.46, 18.461667], [-53.935, 19.098333], [-55.308333, 19.711667],
  [-56.595, 20.301667], [-57.808333, 20.873333], [-58.961667, 21.43],
  [-60.061667, 21.97], [-61.116667, 22.498333], [-62.128333, 23.015],
  [-63.106667, 23.521667], [-64.051667, 24.018333], [-64.97, 24.505],
  [-65.861667, 24.983333], [-66.731667, 25.453333], [-67.581667, 25.916667],
  [-68.413333, 26.371667], [-69.23, 26.821667], [-70.031667, 27.263333],
  [-70.82, 27.7], [-71.596667, 28.131667], [-72.365, 28.556667],
  [-73.123333, 28.976667], [-73.873333, 29.391667], [-74.616667, 29.801667],
  [-75.355, 30.206667], [-76.088333, 30.606667], [-76.816667, 31.003333],
  [-77.543333, 31.393333], [-78.266667, 31.78], [-78.988333, 32.163333],
  [-79.71, 32.54], [-80.431667, 32.915], [-81.153333, 33.283333],
  [-81.875, 33.65], [-82.6, 34.01], [-83.326667, 34.368333],
  [-84.058333, 34.721667], [-84.791667, 35.07], [-85.53, 35.415],
  [-86.273333, 35.756667], [-87.023333, 36.093333], [-87.778333, 36.425],
  [-88.541667, 36.753333], [-89.31, 37.078333], [-90.088333, 37.398333],
  [-90.875, 37.713333], [-91.671667, 38.025], [-92.476667, 38.331667],
  [-93.293333, 38.633333], [-94.121667, 38.93], [-94.963333, 39.223333],
  [-95.816667, 39.511667], [-96.683333, 39.793333], [-97.565, 40.071667],
  [-98.461667, 40.343333], [-99.373333, 40.611667], [-100.303333, 40.871667],
  [-101.251667, 41.128333], [-102.218333, 41.376667], [-103.205, 41.62],
  [-104.213333, 41.856667], [-105.243333, 42.086667], [-106.298333, 42.308333],
  [-107.376667, 42.523333], [-108.483333, 42.731667], [-109.616667, 42.93],
  [-110.78, 43.121667], [-111.975, 43.303333], [-113.203333, 43.475],
  [-114.468333, 43.636667], [-115.771667, 43.786667], [-117.116667, 43.926667],
  [-118.506667, 44.053333], [-119.943333, 44.166667], [-121.433333, 44.266667],
  [-122.981667, 44.35], [-124.591667, 44.418333], [-126.27, 44.466667],
  [-128.026667, 44.493333], [-129.87, 44.5], [-131.813333, 44.478333],
  [-133.87, 44.428333], [-136.061667, 44.345], [-138.413333, 44.22],
  [-140.963333, 44.048333], [-143.765, 43.813333], [-146.908333, 43.5],
  [-150.548333, 43.071667], [-155.018333, 42.455], [-161.406667, 41.42],
]]);

// Coordinates of a hand-drawn polygon around the continental United States
// (CONUS), used to define the bounds of thumbnails and a map visualization.
var conus = ee.Geometry.Polygon([[
  [-123.926, 33.87], [-97.998, 25.245], [-79.893, 24.527],
  [-79.015, 30.955], [-64.775, 46.498], [-126.914, 48.98],
]]);
var conusGeoJson = ee.Serializer.encode(conus);

// Load US state boundaries from a Fusion Table, and draw the eclipse path
// in red over the US states in grey.
var states = ee.FeatureCollection('ft:1fRY18cjsHzDgGiJiS2nnpUU3v9JPDc2HNaR7Xk8');
var greyStates = states.draw('C0C0C0', 1, 1);
var redEclipsePath = ee.FeatureCollection([pathOfTotality]).draw('C00000', 1, 1);
var composite = ee.ImageCollection([greyStates, redEclipsePath]).mosaic();
print(ui.Thumbnail(composite, {crs:'EPSG:5072', region:conusGeoJson}));

// Load and merge morning (Terra) and afternoon (Aqua) MODIS data.
var morning = ee.ImageCollection('MODIS/MOD09GA');
var afternoon = ee.ImageCollection('MODIS/MYD09GA');
var merged = ee.ImageCollection(morning.merge(afternoon));

// A function to extract cloudiness data from a MODIS image.
function cloudiness(image) {
  // The cloud state is in the low two bits of the 'state_1km' band.
  var cloudState = image.select('state_1km').bitwiseAnd(0x03);
  // 0 means no clouds, 1 means cloudy, 2 means mixed, and 3 means
  // missing data. We convert to the range 0.0-1.0 and mask out the
  // missing pixels.
  return cloudState.float()
    .where(cloudState.eq(2), 0.5)
    .updateMask(cloudState.neq(3));
}

// Compute the mean cloudiness around August 21 (DOY 233).
var dateFilter = ee.Filter.dayOfYear(233 - 7, 233 + 7);
var cloudMean = merged.filter(dateFilter).map(cloudiness).mean();

// Draw the mean cloudiness in a palette from blue to dark red.
var palette = ['MediumBlue', 'Silver', 'Crimson', 'DarkRed'];
var cloudMap = cloudMean.visualize({palette:palette});
print(ui.Thumbnail(cloudMap, {crs:'EPSG:5072', region:conusGeoJson}));

// Draw the expected cloud cover in the path of totality over the
// grey US states.
var cloudMapInPath = cloudMap.clip(pathOfTotality);
var compositeOnGrey = ee.ImageCollection([greyStates, cloudMapInPath]).mosaic();
print(ui.Thumbnail(compositeOnGrey, {crs:'EPSG:5072', region:conusGeoJson}));

// Assemble all the pieces into a pretty visualization: the cloud data
// is mostly transparent outside the path of totality, and the path is
// bordered in black for visual contrast.
var finalComposite = ee.ImageCollection([
  cloudMap.updateMask(0.2),
  ee.FeatureCollection([pathOfTotality]).draw('black'),
  cloudMapInPath,
]).mosaic();
Map.addLayer(finalComposite);

// Render this visualization to as a set of map tiles in Google Cloud Storage,
// along with an HTML viewer that we can customize.  (If you try to run this
// job, you will of course need to specify your own Cloud Storage bucket.)
Export.map.toCloudStorage({
  image: finalComposite.clip(conus.bounds()),
  description: '2017-eclipse-clouds',
  bucket: 'mdh-examples',
  fileFormat: 'png',
  path: '2017-eclipse-clouds',
  maxZoom: 10,
  region: conus.bounds(),
});
