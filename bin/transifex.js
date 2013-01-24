const BASE_URL = 'https://www.transifex.com/api/2/project/';

var request = require('request');

var toTransifexLocale = exports.toTransifexLocale = function(locale) {
  var parts = locale.split(/[-_]/);
  if (parts.length >= 2)
    return parts[0].toLowerCase() + "_" + parts[1].toUpperCase();
  return parts[0].toLowerCase();
};

var toBundleLocale = exports.toBundleLocale = function(locale) {
  return locale.toLowerCase().replace(/_/g, '-');
};

var parseProjectDetails = exports.parseProjectDetails = function(project) {
  var details = {};
  project.resources.forEach(function(resource) {
    var parts = resource.name.split('/');
    details[resource.name] = {
      slug: resource.slug,
      path: parts.slice(0, -1).join('/'),
      moduleName: parts[parts.length-1]
    };
  });
  return details;
};

var toBundleMetadata = exports.toBundleMetadata = function(resource) {
  var metadata = {};
  resource.available_languages.forEach(function(language) {
    if (language.code == resource.source_language_code)
      return metadata.root = true;
    metadata[toBundleLocale(language.code)] = true;
  });
  return metadata;
};

var toBundleDict = exports.toBundleDict = function(options) {
  var dict = {};
  options.strings.forEach(function(info) {
    if (!info.translation) return;
    if (options.reviewedOnly && !info.reviewed) return;
    dict[info.key] = info.translation;
  });
  return dict;
};

function main() {
  var program = require('commander');
  program
    .option('-u, --user <user:pass>', 'specify username and password')
    .option('-p, --project <slug>', 'specify project slug')
    .parse(process.argv);
  if (!program.user) {
    console.log('please specify username and password.');
    process.exit(1);
  }
  if (!program.project) {
    console.log('please specify a project.');
    process.exit(1);
  }
  request.get({
    url: BASE_URL + program.project + "/?details",
    headers: {
      'Authorization': 'Basic ' + new Buffer(program.user).toString('base64')
    }
  }, function(error, response, body) {
    console.log("RESPONSE", error, response.statusCode, body);
  });
}

if (!module.parent) main();
