/*
 * This runs the entire test suite with the right reference to the js source
 */

module.exports = function (lib) {
  describe('The library being used for this test suite:', function() {
    it('is: ' + lib, function(){});
  });

  // Load should globally
  require('/usr/lib/node_modules/should/lib/should');

  var solum                              = require('./lib/solum-test.js');
  solum(lib);

  // Models
  var solum_models_tables_page           = require('./lib/models/tables-page-test.js');
  var solum_models_tables_paginatedTable = require('./lib/models/tables-paginatedTable-test.js');
  var solum_models_tables_groupedList    = require('./lib/models/tables-groupedList-test.js');
  solum_models_tables_page('../' + lib);
  solum_models_tables_paginatedTable('../' + lib);
  solum_models_tables_groupedList('../' + lib);
}