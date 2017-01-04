// Load a MODIS global landcover map to create a blue background of water.
var water = ee.Image('MODIS/051/MCD12Q1/2013_01_01').select(0).unmask(0).eq(0);
var background = water.visualize({palette:['FFFFFF', 'aecff2']});

// A helper function to do pretty alpha-compositing of a foreground (top
// image over a background (bottom image.
function composite(top, bot) {
  var wTop = top.mask(1).multiply(top.mask());
  var wBot = bot.mask(1).multiply(ee.Image(1).subtract(top.mask()));
  return wTop.add(wBot).uint8();
}

// Load the 2015 population density data and visualize it globally.
// We take the log of the data before applying a linear color palette,
// because that produces a clearer visualization.  We then use the
// reduceResolution() function to produce a pretty anti-aliased image.
var density2015 = ee.Image('CIESIN/GPWv4/unwpp-adjusted-population-density/2015');
var palette = ['ffffde', '509b92', '03008d'];
var logDensity = density2015.where(density2015.gt(0), density2015.log());
var colorized = logDensity.visualize({min:0, max:8, palette:palette});
var combined = composite(colorized, background);
var antiAliased = combined.reduceResolution(ee.Reducer.mean(), true);
print(ui.Thumbnail(combined, {dimensions:720}));

// Load the 2015 population count data and visualize it in the area
// around Google headquarters in Mountain View, California.  Add up
// the population count pixels in that region to compute a total
// population estimate.
var count2015 = ee.Image('CIESIN/GPWv4/population-count/2015');
var googleBuffer = ee.Geometry.Point(-122.085, 37.422).buffer(100000, 1000);
var colorized = count2015.visualize({min:0, max:10000, palette:palette});
var bayArea = composite(colorized, background).clip(googleBuffer);
print(ui.Thumbnail(bayArea, {crs:'EPSG:3857', dimensions:300}));
print(count2015.reduceRegion('sum', googleBuffer));

// Load all the population count data for all years, and plot a
// chart of population in the Google area over time.
var counts = ee.ImageCollection('CIESIN/GPWv4/population-count');
print(ui.Chart.image.series({
    imageCollection: counts.map(function(image) {
      return image.set('year', image.date().format('yyyy'));
    }),
    region: googleBuffer,
    reducer: ee.Reducer.sum(),
    xProperty: 'year'
  })
  .setOptions({
    title: 'Population within 100km of Google HQ',
    vAxis: {title: 'Population'},
    legend: 'none',
    pointSize: 4,
  }));

// Hard-code a list of city locations to play with. Buffer each point by 10km.
var cities = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([-122.445373, 37.745743]), {name: 'San Francisco'}),
  ee.Feature(ee.Geometry.Point([-118.288421, 34.061761]), {name: 'Los Angeles'}),
  ee.Feature(ee.Geometry.Point([103.864746, 1.363549]), {name: 'Singapore'}),
  ee.Feature(ee.Geometry.Point([-73.974037, 40.770401]), {name: 'New York'}),
  ee.Feature(ee.Geometry.Point([2.350044, 48.85613168160397]), {name: 'Paris'}),
  ee.Feature(ee.Geometry.Point([3.341217, 6.520001]), {name: 'Lagos'}),
]).map(function(city) { return city.buffer(10000); });

// Print a chart with the mean population density in each city area over time.
print(ui.Chart.image.seriesByRegion({
    imageCollection: ee.ImageCollection('CIESIN/GPWv4/population-density'),
    regions: cities,
    reducer: ee.Reducer.mean(),
    seriesProperty: 'name',
  })
  .setChartType('ColumnChart')
  .setOptions({
    title: 'Estimated Population Density by City',
    vAxis: {title: 'People per Square Kilometer'},
  }));

// Load the raw population density for 2015 in addition to the UN-adjusted
// version we used earlier, compute the ratio, and map the log ratio onto
// a linear color palette.
var rawDensity2015 = ee.Image('CIESIN/GPWv4/population-density/2015');
var ratio = density2015.divide(rawDensity2015);
var logRatio = ratio.where(ratio.neq(0), ratio.log());
print(ui.Thumbnail(logRatio, {
  min:-0.5,
  max:0.5,
  palette:['Crimson', 'Silver', 'MediumBlue'],
}));

// Load the ancillary data grids and map the log of the mean admin unit
// area.
var grids = ee.Image('CIESIN/GPWv4/ancillary-data-grids');
var area = grids.select('mean-administrative-unit-area');
print(ui.Thumbnail(area.log10(), {
  min: 0,
  max: 6,
  palette: ['Crimson', 'Silver', 'MediumBlue'],
}));
