/*global solum:true, $:true, ko:true, module:true */

/*
 * solum.js - validation
 * author: brandon eum
 * date: Sep 2012
 */

/**
 * Dependencies:
 *  - Assumes knockout.js
 *  - Assumes solum.js
 */

// Check if we are in a node.js environment for unit testing
if (typeof require === 'function') {
  solum = require('../solum.js');
  ko    = require('../../tests/mocha/mocks/mock-ko.js');
}

// Access services library (if needed) through root variable - easier to rename refactor later
(function (root) {
  "use strict";

   /**
   * Validation namespace which includes the validator and the standard constraints
   */
  root.services.validation = {};

  /**
   * Date/number format for the constraint engine
   */
  root.services.validation.defaultConfig = {

  };

  /**
   * Validation engine that uses the standard constraints, plus any user-specified
   * constraints to validate an object.
   */
  root.services.validation.validator = function (config) {
    var self, translator, hasError;
    self = this;

    // No use yet, but leaving just in case
    config = $.extend(config, root.services.validation.defaultConfig);

    translator   = root.get.service('translator');
    self.constraints = root.services.validation.constraints();

    /**
     * Loop through all of the enumerable properties of an entity and validate
     * them against the constraints
     */
    self.isEntityValid = function (entity) {
      var isValid, i, stdProps, skip, j, errors;
      isValid = true;

      // Loop through all of the properties and validate
      for (i in entity) {
        if (entity.hasOwnProperty(i)) {
          // This check for entity standard properties is purely for IE8 support
          stdProps = ['errors', 'constraints', 'hasError'];
          skip = false;
          for (j in stdProps) {
            if (stdProps.hasOwnProperty(j) && i === stdProps[j]) {
              skip = true;
            }
          }

          // Skip standard properties
          if (!skip) {

            // Validate that property
            errors = self.isValid(entity[i](), entity.constraints[i]);

            // Clear existing errors
            entity.errors[i].removeAll();

            // Add new errors to the error object
            for (j in errors) {
              if (errors.hasOwnProperty(j)) {
                entity.errors[i].push(errors[j]);
              }
            }

            if (errors.length > 0) {
              isValid = false;
            }
          }
        }
      }

      return isValid;
    };

    // Public method to validate an object/literal via a list of constraints
    self.isValid = function (subject, constraintList) {
      var errors, msg, i;
      errors = [];
      msg = "";

      for (i in constraintList) {
        if (constraintList.hasOwnProperty(i)) {
          msg = hasError(subject, constraintList[i]);
          if (msg) {
            errors.push(msg);

            // Short circuit execution unless explicitly told otherwise
            if (!constraintList[i].continueOnFail) {
              break;
            }
          }
        }
      }

      return errors;
    };

    // Private function that actually does the validation
    hasError = function (subject, c) {
      var validate, name;
      validate = null;

      if (typeof c.constraint === "function") {
        validate = c.constraint;
      } else if (typeof c.constraint === "string") {
        // Loop through the constraints and find the std constraint to use
        for (name in self.constraints) {
          if (self.constraints.hasOwnProperty(name) && c.constraint === name) {
            validate = self.constraints[name];
            break;
          }
        }
      }

      // Validator not found
      if (validate === null) {
        throw "Validator: Constraint not found: " + c.constraint;
      }

      try {
        validate(subject, c.params);
      } catch (e) {
        if (typeof e.error !== 'string') {
          throw e;
        }

        return translator.translate(e.error, c.msgTranslations);
      }

      return false;
    };
  };// END VALIDATOR

  // Standard constraints
  root.services.validation.constraints = function (config) {
    var self, dateNumberFormat;

    self = this;
    dateNumberFormat = config.dateAndNumberFormatLocalization;

    self.notNull = function (subject) {
      if (subject === null || subject === undefined) {
        throw {error: "errors.form.not_null"};
      }

      return true;
    };

    self.minLength = function (subject, min) {
      if (typeof subject !== "string") {
        throw {error: "errors.form.wrongtype"};
      } else if (subject.length < min) {
        throw {error: "errors.form.minLength"};
      }

      return true;
    };

    self.maxLength = function (subject, max) {
      if (typeof subject !== "string") {
        throw {error: "errors.form.wrongtype"};
      } else if (subject.length > max) {
        throw {error: "errors.form.minLength"};
      }

      return true;
    };

    self.type = function (subject, type) {
      if ((type === "null" && subject !== null) || typeof subject !== type) {
        throw {error: "errors.form.type"};
      }

      return true;
    };

    // DATE Constraints

    self.date = function (subject, params) {
      var year, month, day, test;

      if (!dateNumberFormat.date.pattern.test(subject)) {
        throw {error: "errors.form.date.invalid_format"};
      }

      // Y/M/d value validation
      test  = Date.parseExact(subject, dateNumberFormat.date.format);

      if (test === null) {
        throw {error: "errors.form.date.invalid_format"};
      }

      year  = test.getFullYear();
      month = test.getMonth();
      day   = test.getDay() + 1; // 0 indexed for day of month

      try {
        Date.validateDay(day, year, month);
      } catch (e) {
        throw {error: "errors.form.date.invalid_format"};
      }

      return true;
    };

    self.minDate = function (subject, params) {
      var min, test;
      min  = params.minDate;
      test = Date.parseExact(subject, dateNumberFormat.date.format);

      if (test < min) {
        throw {error: "errors.form.date.min_date"};
      }

      return true;
    };

    self.maxDate = function (subject, params) {
      var max, test;
      max  = params.maxDate;
      test = Date.parseExact(subject, dateNumberFormat.date.format);
      if (test > max) {
        throw {error: "errors.form.date.max_date"};
      }

      return true;
    };
  }; // End CONSTRAINTS
}(solum));