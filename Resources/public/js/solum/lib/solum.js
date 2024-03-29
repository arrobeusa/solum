/*global solum:true, $:true, ko:true, module:true */

/**
 * solum.js
 * Author: Brandon Eum
 * Created: Sep 2012
 */

/**
 * Dependencies:
 *  - Assumes jQuery
 *  - Assumes knockout.js
 */

// Setup mock dependencies if we are in a node.js unit test environment
if (typeof require === 'function') {
  ko = require('../tests/mocha/mocks/mock-ko.js');
  $  = require('../tests/mocha/mocks/mock-jquery.js');
}

var solum = (function () {
  "use strict";

  var self, api, getSingleton;

  self = this;

  // Keep as a function just in case we want to do something with it later
  api = function () {};

  /**
   * Provide a clean way to do inheritance in JS
   */
  api.extend = function (subclass, superclass) {
    var F = function () {};
    F.prototype = superclass.prototype;
    subclass.prototype = new F();
    subclass.prototype.constructor = subclass;

    // Provide the constructor of the superclass to the subclass
    subclass.superclass = superclass.prototype;
  };

  /**
   * Library-wide configurations that will be used by more than one service/model
   *
   * Right now, its just date/number localization, but could be other things in
   * the future.
   */
  api.config = {
    locale: "en",
    dateAndNumberFormatLocalization: {
      en: {
        date: {
          long_format: 'MMMM d, yyyy',
          format:      'yyyy-M-dd',
          pattern:     /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
          delimiter:   '-',
          map:         {year: 2, month: 1, day: 0}
        },
        number: {
          thousand_delimiter: ',',
          decimal:            '.'
        },
        currency: {
          currency_symbol:    '&#36;',
          thousand_delimiter: ',',
          decimal:            '.'
        }
      }
    }
  };

  /**
   * The locale is used in the translator and validator (for date formats) and is
   * important enough that it deserves its own setter.
   */
  api.setLocale = function (loc) {
    api.config.locale = loc;
  };

  /**
   * The models namespace is for page models.  It should roughly be one model per
   * page, unless those pages have the exact same elements and user interactions.
   */
  api.models = {};

  api.getModel = function (group, model) {
    if (typeof api.models[group] !== 'object' || typeof api.models[group][model] !== 'function') {
      throw "The requested model does not exist.";
    }

    return new api.models[group][model]();
  };

  /**
   * The components namespace is not implemented in this file, but accepts plug-in
   * files that will use the services defined here to create re-useable models with
   * knockout and jquery.
   */
  api.components = {};

  api.getComponent = function (group, component) {
    if (typeof api.components[group] !== 'object' || typeof api.components[group][component] !== 'function') {
      throw "The requested component does not exist.";
    }

    return new api.components[group][component]();
  };

  /**
   * The entities namespace is used to represent objects in your system.  They have
   * properties and methods and know how to validate themselves for client-side
   * validation.
   */
  api.entities = {};

  /**
   * Adds all of the necessary standard properties to the entity
   */
  api.constructEntity = function (entity) {
    var i;
    entity.errors = {};
    for (i in entity) {
      if (entity.hasOwnProperty(i)) {
        entity.errors[i] = ko.observableArray([]);
      }
    }

    // Add a convenience method for checking if there are errors
    entity.hasError = ko.computed(function () {
      var hasError, i;

      hasError = false;
      for (i in this.errors) {
        if (this.errors.hasOwnProperty(i) && this.errors[i]().length > 0) {
          hasError = true;
        }
      }

      return hasError;
    }, entity);

    // Make the standard properties non-enumerable -- Does not work in IE8 grrr...
    if (typeof Object.defineProperty === 'function') {
      Object.defineProperty(entity, 'constraints', {enumerable: false});
      Object.defineProperty(entity, 'errors',      {enumerable: false});
      Object.defineProperty(entity, 'hasError',    {enumerable: false});
    }
  };

  /**
   * It is a requirement that entities have no arguments in their constructor so
   * that we can use a generic get method to get the entity.
   */
  api.getEntity = function (name) {
    if (typeof name !== 'string') {
      throw "The entity name must be a string";
    }

    return new self.entities[name]();
  };

  /**
   * Be lazy about constructing instances of each service, and only construct them
   * as needed.  They should be singleton objects, so store the single instance
   * here.
   */
  api.instances = {};

  /**
   * If an instance exists and !isReset, return that, otherwise construct and set
   * the singleton to be the newly constructed instance
   */
  getSingleton = function (group, name, config, isReset) {
    var isRightType, doesGroupExist, doesSvcExist;

    isRightType    = (typeof group === 'string' && typeof name === 'string');
    doesGroupExist = (typeof api.services[group] === 'object');
    doesSvcExist   = (doesGroupExist && typeof api.services[group][name] === 'function');

    if (!isRightType || !doesSvcExist) {
      throw "The requested service does not exist. Group: " + group + " , name: " + name;
    }

    // Check if an instances namespace for the group exists, otherwise create
    if (typeof api.instances[group] !== 'object') {
      api.instances[group] = {};
      api.instances[group][name] = null;
    }

    // Create the new singleton and set as the global instance
    if (api.instances[group][name] === null || isReset) {
      api.instances[group][name] = new api.services[group][name](config);
    }

    return api.instances[group][name];
  };

  /**
   * Get the singleton of one of the solum services, if it is not constructed,
   * construct it here.
   */
  api.getService = function (group, name, config) {
    return getSingleton(group, name, config, false);
  };

  /**
   * Configure the options for a particular service, this will instantiate the
   * service if it does not already exist.  This will also change the global config
   * for that service for all cases that you are using it.
   */
  api.configureService = function (group, name, config) {
    return getSingleton(group, name, config, true);
  };

  /**
   * Services namespace houses:
   *  - Ajax Management
   *  - Validation
   *  - Symfony-style Translation
   */
  api.services = {};

  // Return solum's public API
  return api;
}());

if (typeof module === "object") {
  module.exports = solum;
}