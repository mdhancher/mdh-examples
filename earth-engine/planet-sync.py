#!/usr/bin/env python
import calendar
from collections import defaultdict
from cStringIO import StringIO
import ee
from google.cloud import storage
from oauth2client.client import GoogleCredentials
import os
import time
import xml.etree.ElementTree as ET


# The location of the input data in Google Cloud Storage.
GCS_BUCKET = 'sistema_alertas_sccon'
GCS_PREFIX = 'tiles/'
GCS_IGNORE = ['init']

# The Earth Engine image collection to write to.
EE_COLLECTION = 'projects/mdh/nexgenmaptest'

# The prefix for full-qualified Earth Engine resource names for legacy projects.
# (Right now all projects are legacy projects!)
EE_RESOURCE_NAME_PREFIX = 'projects/earthengine-legacy/assets'

# The maximum number of images to try to ingest per run.
MAX_IMAGES_TO_INGEST_PER_RUN = 3000

# The names to use for the ingested bands in Earth Engine.
BAND_NAMES = ['B', 'G', 'R', 'N']

# The filename extensions for the TIF and corresponding XML files in Cloud Storage.
TIF_EXT = '_cut.tif'
XML_EXT = '.xml'

# The XML namespaces from which we will be extracting metadata.
XML_NAMESPACES = {
  'eop': 'http://earth.esa.int/eop',
  'opt': 'http://earth.esa.int/opt',
  'ps': 'http://schemas.planet.com/ps/v1/planet_product_metadata_geocorrected_level',
}

# The specification of the metadata properties that we will extract from the XML
# file, specified as triples with with the XML specifier, the corresponding name
# to use in Earth Engine, and a parsing function to decode the string to its value.
METADATA_SPECS = [
  ['.//eop:acquisitionType', 'acquisition_type', unicode],
  ['.//eop:productType', 'product_type', unicode],
  ['.//eop:Platform/eop:shortName', 'platform_short_name', unicode],
  ['.//eop:Platform/eop:serialIdentifier', 'platform_serial_identifier', unicode],
  ['.//eop:Platform/eop:orbitType', 'platform_orbit_type', unicode],
  ['.//eop:Instrument/eop:shortName', 'instrument_short_name', unicode],
  ['.//eop:sensorType', 'sensor_type', unicode],
  ['.//eop:resolution', 'resolution', float],
  ['.//ps:scanType', 'scan_type', unicode],
  ['.//eop:orbitDirection', 'orbit_direction', unicode],
  ['.//eop:incidenceAngle', 'incidence_angle', float],
  ['.//opt:illuminationAzimuthAngle', 'illumination_azimuth_angle', float],
  ['.//opt:illuminationElevationAngle', 'illumination_elevation_angle', float],
  ['.//ps:azimuthAngle', 'azimuth_angle', float],
  ['.//ps:spaceCraftViewAngle', 'space_craft_view_angle', float],
  ['.//opt:cloudCoverPercentage', 'cloud_cover_percentage', float],
  ['.//ps:unusableDataPercentage', 'unusable_data_percentage', float],
]

# The XML spec for the property containing the image acquisition / start time.
XML_METADATA_TIME_SPEC = './/ps:acquisitionDateTime'


def TimestampToSeconds(iso_time_string):
  """Parses a date string and returns a timestamp in millisconds.

  Args:
    date_string: A date string in the format used in Planet metadata, i.e.
        the form YYYY-mm-ddTHH-MM-SS+00:00 in GMT.

  Returns:
    The corresponding timestamp in milliseconds since the Unix epoch.
  """
  timestamp = time.strptime(iso_time_string, '%Y-%m-%dT%H:%M:%S+00:00')
  return calendar.timegm(timestamp)
  

def GetExistingAssetIds(collection_id, batch_size=10000):
  """Returns a list of existing asset IDs in an ImageCollection."""
  collection = ee.ImageCollection(collection_id)
  results = []
  start_time = time.time()
  page_token = ' '  # A token guaranteed to come before all asset ids.
  while True:
    batch = (collection.filter(ee.Filter.gt('system:index', page_token))
             .limit(batch_size)
             .reduceColumns(ee.Reducer.toList(), ['system:index'])
             .get('list')
             .getInfo())
    results.extend(batch)
    if len(batch) < batch_size:
      duration = time.time() - start_time
      return results
    else:
      page_token = batch[-1]


def GetBlobsInBucketByDirectory(bucket_id, prefix=None, ignore=None):
  """Scans and returns the blobs in a bucket, grouped by directory.

  Scans the contents of a Cloud Storage bucket and returns an index of the
  blobs that are present, grouped by the parent directory name, as a
  dictionary of dictionaries of Blob ojbects.

  Args:
    bucket_id: The id of the Cloud Storage bucket to list.
    prefix: An optional prefix to restrict the scan to within the bucket.
    ignore: An optional list of object filenames to ignore.

  Returns:
    A dictionary that maps directory names onto dictionaries which in
    turn map object filenames onto the corresponding Blob objects.
  """
  bucket = storage.Client().get_bucket(bucket_id)
  blobs = bucket.list_blobs(prefix=prefix)
  blob_dict = defaultdict(dict)
  for blob in blobs:
    directory, filename = os.path.split(blob.name)
    if ignore and filename in ignore:
      continue
    blob_dict[directory][filename] = blob
  return blob_dict


def BuildIngestManifest(asset_id, xml_blob, tif_blob):
  """Builds an ingestion manifest for an asset given XML and TIF blobs."""
  xml = xml_blob.download_as_string()
  root = ET.parse(StringIO(xml)).getroot()

  metadata = {}
  for specifier, name, parser in METADATA_SPECS:
    element = root.find(specifier, XML_NAMESPACES)
    metadata[name] = parser(element.text)

  tif_uri = 'gs://%s/%s' % (tif_blob.bucket.name, tif_blob.name)
  time_string = root.find(XML_METADATA_TIME_SPEC, XML_NAMESPACES).text

  return {
    'name': os.path.join(EE_RESOURCE_NAME_PREFIX, EE_COLLECTION, asset_id),
    'tilesets': [{
      'sources': [{
        'uris': [tif_uri],
      }],
    }],
    'bands': [{'id': bid, 'tileset_band_index': index} for (index,bid) in enumerate(BAND_NAMES)],
    'properties': metadata,
    'start_time': {
      'seconds': TimestampToSeconds(time_string),
    },
  }
  

def ScanAndIngest():
  """Scans for and ingests all available images."""
  print 'Scanning for exising assets...'
  existing_asset_ids = GetExistingAssetIds(EE_COLLECTION)
  print 'Found %s existing assets.' % len(existing_asset_ids)

  print 'Scanning for available assets...'
  blobs_by_directory = GetBlobsInBucketByDirectory(GCS_BUCKET, GCS_PREFIX, GCS_IGNORE)
  print 'Found %s available assets.' % len(blobs_by_directory)

  count = 1
  for directory, blobs in blobs_by_directory.iteritems():
    _, asset_id = os.path.split(directory)

    if asset_id in existing_asset_ids:
      print 'Skipping %s: already ingested' % asset_id
      continue
  
    try:
      xml_blob = blobs[asset_id + XML_EXT]
    except:
      print 'Skipping %s: missing XML file' % asset_id
      continue

    try:
      tif_blob = blobs[asset_id + TIF_EXT]
    except:
      print 'Skipping %s: missing TIFF file' % asset_id
      continue

    manifest = BuildIngestManifest(asset_id, xml_blob, tif_blob)
    task = ee.data.startIngestion(ee.data.newTaskId()[0], manifest)
    print 'Ingesting %s as task %s' % (asset_id, task['id'], count)

    if count == MAX_IMAGES_TO_INGEST_PER_RUN:
      print 'Stopping after ingesting %s images.' % count
      break
    count = count + 1


if __name__ == '__main__':
  print 'Initializing...'
  ee.Initialize(GoogleCredentials.get_application_default(), use_cloud_api=True)
  ScanAndIngest()
