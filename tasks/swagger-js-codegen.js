module.exports = function(grunt) {
  'use strict';
  var CodeGen = require('swagger-js-codegen').CodeGen;
  var fs = require('fs');


  /**
   * create api 
   * @param  {string} swagger specification
   * @param  {object} api     parameters to pass to the gnerator
   * @param  {object} dest    where we should write the generated code
   */
  function createApiFile(swagger, api, dest) {
    var source;
    if (api.type === 'angular' || api.angularjs === true) {
      source = CodeGen.getAngularCode({
        moduleName: api.moduleName,
        className: api.className,
        swagger: swagger
      });
    } else if (api.custom === true) {
      source = CodeGen.getCustomCode({
        className: api.moduleName,
        template: api.template,
        swagger: swagger
      });
    } else {
      source = CodeGen.getNodeCode({
        className: api.moduleName,
        swagger: swagger
      });
    }
    grunt.log.writeln('Generated ' + api.moduleName + ' from ' + api.swagger);
    fs.writeFileSync(dest + '/' + api.moduleName + '.js', source, 'UTF-8');
  }


  /**
   * create models
   * @param  {string} swagger          specification
   * @param  {object} api              [description]
   * @param  {object} options          grunt options
   * @param  {string} modelDestination where we should create the model
   */
  function createModels(swagger,api,options,modelDestination) {
    if (modelDestination !== null) {
      var params = {
        swagger: swagger
      };
      if (api.nameSpace !== undefined || options.nameSpace !== undefined) {
        params.nameSpace = api.nameSpace || options.nameSpace;
      }
      // if not defined use the moduleName
      if (params.nameSpace===undefined) {
        params.nameSpace = api.moduleName;
      }
      var nameSpaceModels = CodeGen.getNodeModelCode(params);
      var models = nameSpaceModels.modelCodeSet;
      // write index.js
      fs.writeFileSync(modelDestination + '/index.js', nameSpaceModels.nameSpaceCode, 'UTF-8');

      for (var model in models) {
        grunt.log.writeln(models[model].fileName);
        fs.writeFileSync(modelDestination + '/' + models[model].fileName + '.js', models[model].code, 'UTF-8');
      }
    }
  }

  grunt.registerMultiTask('swagger-js-codegen', 'Swagger codegen for Javascript', function() {
    
    var request = require('request');
    var Q = require('q');
    var _ = require('lodash');

    var options = this.options();
    var dest = options.dest;
    var promises = [];
    var done = this.async();
    var modelDestination = options.model === undefined ? null : options.model;

    grunt.file.mkdir(dest);

    if (modelDestination !== null) {
      grunt.file.mkdir(modelDestination);
    }

    options.apis.forEach(function(api) {
      var deferred = Q.defer();
      if (api.swagger.substring(0, 'http://'.length) === 'http://' || api.swagger.substring(0, 'https://'.length) === 'https://') {
        request({
          uri: api.swagger,
          method: 'GET'
        }, function(error, response, body) {
       
          if (error || response.statusCode !== 200) {
            deferred.reject('Error while fetching ' + api.swagger + ': ' + (error || body));
          } else {
            var swagger = JSON.parse(body);             
            createApiFile(swagger,api,dest);
            grunt.file.mkdir(modelDestination+'/'+api.moduleName.toLowerCase());
            createModels(swagger,api,options,modelDestination+'/'+api.moduleName.toLowerCase());
            deferred.resolve();
          }
        });
      } else {
        fs.readFile(api.swagger, 'UTF-8', function(err, data) {
          if (err) {
            deferred.reject(err);
          } else {
            var swagger = JSON.parse(data);
            createApiFile(swagger,api,dest);
            grunt.file.mkdir(modelDestination+'/'+api.moduleName.toLowerCase());
            createModels(swagger,api,options,modelDestination+'/'+api.moduleName.toLowerCase());                          
            deferred.resolve();
          }
        });
      }
      promises.push(deferred.promise);
    });
    Q.all(promises).then(function() {
      done();
    }).catch(function(error) {
      var e;
      if (_.isObject(error) && error.body) {
        e = JSON.stringify(error.body, null, 2);
      } else if (_.isObject(error)) {
        e = JSON.stringify(error, null, 2);
      } else if (error instanceof Error || _.isString(error)) {
        e = error;
      } else {
        e = new Error('Unknown error');
      }
      grunt.fail.fatal(e);
    });
  });
};