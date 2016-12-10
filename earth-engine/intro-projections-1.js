// Load a global land cover map for the year 2012.  The MCD12Q1
// data product is produced from MODIS data and documented here:
// https://lpdaac.usgs.gov/dataset_discovery/modis/modis_products_table/mcd12q1
var landCover = ee.Image('MODIS/051/MCD12Q1/2012_01_01');

// Make a pretty visualization.  We select the IGBP land cover band,
// apply a color palette, and request that the results be down-sampled
// using a "mean" reducer to get pretty anti-aliased results.
var image = landCover.visualize({
    bands: ['Land_Cover_Type_1'],
    min: 0,
    max:17,
    palette: [
        'aec3d6', '162103', '235123', '399b38', '38eb38', '39723b',
        '6a2424', 'c3a55f', 'b76124', 'd99125', '92af1f', '10104c',
        'cdb400', 'cc0202', '332808', 'd7cdcc', 'f7e174', '743411',
    ],
}).reduceResolution(ee.Reducer.mean(), true, 128);

// First let's make some global thumbnails.

// Use data's default sinusoidal projection.
print(ui.Thumbnail(image));

// Use an equirectangular projection. The data's sinusoidal projection
// has a singularity at the pole which can cause problems, so we shy
// away from it.
print(ui.Thumbnail(image, {
    crs: 'EPSG:4326',
    bbox: [-180, -89.5, 180, 89.5],
}));

// Use a Mercator projection. Now the poles are infinitely far away, so
// we clip to +/- 80 degrees latitude. We also make this image slighlty
// smaller, since it's shape is more square.
print(ui.Thumbnail(image, {
    crs: 'EPSG:3857',
    bbox: [-180, -80, 180, 80],
    dimensions: 400,
}));

// Now let'sm make some thumbnails of the continental US (i.e. CONUS).

// Load the United States country boundary from a Fusion Tables table
// and clip it to the continental US only.
var conus = ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw')
    .filter(ee.Filter.equals('Country', 'United States'))
    .geometry()
    .intersection(ee.Geometry.Rectangle([-128, 20, -65, 50]));

// Use data's default sinusoidal projection.
print(ui.Thumbnail(image.clip(conus)));

// Use an equirectangular projection.
print(ui.Thumbnail(image.clip(conus), {crs: 'EPSG:4326'}));

// Use a Mercator projection.
print(ui.Thumbnail(image.clip(conus), {crs: 'EPSG:3857'}));

// Use a CONUS Albers equal-area conic projection.
print(ui.Thumbnail(image.clip(conus), {crs: 'EPSG:5072'}));

// Use UTM Zone 10N (appropriate for California).
print(ui.Thumbnail(image.clip(conus), {crs: 'EPSG:32610'}));

// Use UTM Zone 19N (appropriate for Maine).
print(ui.Thumbnail(image.clip(conus), {crs: 'EPSG:32619'}));
