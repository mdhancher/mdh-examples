// Load the global accessibility to cities image and the friction surface.
var accessibility = ee.Image('Oxford/MAP/accessibility_to_cities_2015_v1_0');
var friction = ee.Image('Oxford/MAP/friction_surface_2015_v1_0');

// Color palettes for visualizing accessibility and friction data.
var accessibilityPalette = ['f2fef8', 'defce1', 'c9f3bc', 'cbeca7', 'd6e793',
  'e2d87b', 'd4a561', 'c46c49', 'ab3a38', '922f4b', '7d285d', '672069',
  '3a1453', '1b0c3c', '050526', '00030f', '000000'];
var frictionPalette = ['313695', '4575b4', '74add1', 'abd9e9', 'e0f3f8',
  'ffffbf', 'fee090', 'fdae61', 'f46d43', 'd73027', 'a50026'];

// Apply the color palette to the log of travel time.
var accessibilityVis = {min:0, max:10, palette:accessibilityPalette};
var logAccessibility = accessibility.where(accessibility.gt(0), accessibility.log());
var accessibilityRgb = logAccessibility.visualize(accessibilityVis);

// Composite onto a solid-color background to fill in the oceans.
var background = ee.Image(0).visualize({palette:['11101e']});
var accessibilityBlended = background.blend(accessibilityRgb).updateMask(1);

// Add the visualization of accessibility to cities to the map.
Map.addLayer(accessibilityBlended, {}, 'Accessibility to Cities 2015');

// Apply the color palette to the friction surface.
var frictionVis = {min:0.0022, max:0.04, palette:frictionPalette};
var frictionRgb = friction.visualize(frictionVis);

// Add the visualization of the friction surface to the map, default off.
Map.addLayer(frictionRgb, {}, 'Friction Surface', false);

// Locations of hospitals on Wikipedia's list of hospitals in Hawaii:
// https://en.wikipedia.org/wiki/List_of_hospitals_in_Hawaii
var hospitals = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point(-155.474303, 19.199648)), // Ka'u Hospital, Pahala, Hawaii
  ee.Feature(ee.Geometry.Point(-155.798820, 20.232308)), // Kohala Hospital, Kapaau, Hawaii
  ee.Feature(ee.Geometry.Point(-155.919575, 19.519953)), // Kona Community Hospital, Kealakekua, Hawaii
  ee.Feature(ee.Geometry.Point(-155.667073, 20.022712)), // North Hawaii Community Hospital, Waimea, Hawaii
  ee.Feature(ee.Geometry.Point(-159.672662, 21.960739)), // Kauai Veterans Memorial Hospital, Waimea, Kauai
  ee.Feature(ee.Geometry.Point(-159.314899, 22.087349)), // Samuel Mahelona Memorial Hospital, Kapaa, Kauai
  ee.Feature(ee.Geometry.Point(-159.367596, 21.986301)), // Wilcox Memorial Hospital, Lihue, Kauai
  ee.Feature(ee.Geometry.Point(-156.919345, 20.825893)), // Lanai Community Hospital, Lanai City, Lanai
  ee.Feature(ee.Geometry.Point(-156.491893, 20.884188)), // Cancer Institute of Maui, Wailuku, Maui
  ee.Feature(ee.Geometry.Point(-156.359472, 20.701346)), // Kula Hospital, Kula, Maui
  ee.Feature(ee.Geometry.Point(-156.491672, 20.884633)), // Maui Memorial Medical Cente, Wailuku, Maui
  ee.Feature(ee.Geometry.Point(-157.759709, 21.380644)), // Adventist Health Castle, Kailua, Oahu
  ee.Feature(ee.Geometry.Point(-157.817951, 21.405076)), // Hawaii State Hospital, Kaneohe, Oahu
  ee.Feature(ee.Geometry.Point(-157.956410, 21.676608)), // Kahuku Medical Center, Kahuku, Oahu
  ee.Feature(ee.Geometry.Point(-157.940540, 21.383489)), // Pali Momi Medical Center, Aiea, Oahu
  ee.Feature(ee.Geometry.Point(-158.029087, 21.372424)), // The Queen's Medical Center, ʻEwa Beach, Oahu
  ee.Feature(ee.Geometry.Point(-158.028468, 21.498837)), // Wahiawa General Hospital, Wahiawa, Oahu
  ee.Feature(ee.Geometry.Point(-157.901940, 21.362962)), // Kaiser Permanente Moanalua Medical Center, Honolulu, Oahu
  ee.Feature(ee.Geometry.Point(-157.835763, 21.300063)), // Kapi'olani Medical Center for Women & Children, Honolulu, Oahu
  ee.Feature(ee.Geometry.Point(-157.859245, 21.321456)), // Kuakini Medical Center, Honolulu, Oahu
  ee.Feature(ee.Geometry.Point(-157.855898, 21.308275)), // The Queen's Medical Center, Honolulu, Oahu
  ee.Feature(ee.Geometry.Point(-157.837493, 21.300566)), // Shriners Hospital, Honolulu, Oahu
  ee.Feature(ee.Geometry.Point(-157.852753, 21.302731)), // Straub Clinic & Hospital, Honolulu, Oahu
  ee.Feature(ee.Geometry.Point(-157.892220, 21.359770)), // Tripler Army Medical Center, Honolulu, Oahu
]);

// Paint the locations of hospitals into an image.
var hospitalImage = ee.Image(0).float().paint(hospitals, 1);
// Compute the cumulative travel time from everywhere to the nearest hospital.
var travelTime = friction.cumulativeCost(hospitalImage, 200000);

// Apply the color palette to the log of travel time.
var logTravelTime = travelTime.where(travelTime.gt(0), travelTime.log());
var travelTimeRgb = logTravelTime.visualize(accessibilityVis);

// Mask the oceans and composite onto a solid-color background.
var travelTimeMasked = travelTimeRgb.mask(accessibility.mask());
var travelTimeBlended = background.blend(travelTimeMasked).updateMask(1);

// Add the visualization of our custom accessibility indicator to the map.
Map.addLayer(travelTimeBlended, {}, 'Accessibility to Hawaii Hospitals', false);

// Rectangles that define thumbnail image boundaries for Africa and Hawaii.
var africa = ee.Geometry.Rectangle(
  [-19.511719, -36.315125, 61.347656, 38.548165], null, false);
var hawaii = ee.Geometry.Rectangle(
  [-160.532227 , 18.573362, -154.489746, 22.684984], null, false);

// Make a thumbnail of accessibility to cities in Africa.
print(ui.Thumbnail(accessibilityBlended, {
  crs: 'SR-ORG:6627',
  region: africa.toGeoJSON(),
  dimensions: '512',
  format: 'jpg',
}));

// Make a thumbnail of the friction surface in Africa.
print(ui.Thumbnail(frictionRgb, {
  crs: 'SR-ORG:6627',
  region: africa.toGeoJSON(),
  dimensions: '512',
  format: 'jpg',
}));

// Make a thumbnail of accessibility to cities in Hawaii.
print(ui.Thumbnail(accessibilityBlended, {
  crs: 'SR-ORG:6627',
  region: hawaii.toGeoJSON(),
  dimensions: '512',
  format: 'jpg',
}));

// Make a thumbnail of accessibility to hospitals in Hawaii.
print(ui.Thumbnail(travelTimeBlended, {
  crs: 'SR-ORG:6627',
  region: hawaii.toGeoJSON(),
  dimensions: '512',
  format: 'jpg',
}));

// Make a thumbnail of the accessibility color palette.
print(ui.Thumbnail(ee.Image.pixelLonLat().select('longitude'), {
  region: [[0, 0], [0, 1], [1, 1], [1,0]],
  dimensions: '512x32',
  palette: accessibilityPalette,
  min:1, max:0
}));

// Make a thumbnail of the friction surface color palette.
print(ui.Thumbnail(ee.Image.pixelLonLat().select('longitude'), {
  region: [[0, 0], [0, 1], [1, 1], [1,0]],
  dimensions: '512x32',
  palette: frictionPalette,
  min:1, max:0
}));
