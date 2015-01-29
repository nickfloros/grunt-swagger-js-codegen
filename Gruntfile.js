module.exports = function(grunt) {
  'use strict';
  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: ['Gruntfile.js', 'tasks/**/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    'swagger-js-codegen': {
      queries: {
        options: {
          apis: [{
            swagger: 'http://aa-rm002:7001/api-docs/default/task',
            moduleName: 'Task'
          }, {
            swagger: 'http://aa-rm002:7001/api-docs/default/audit',
            moduleName: 'Audit'
          }, {
            swagger: 'http://aa-rm002:7001/api-docs/default/customerrequest',
            moduleName: 'Customer'
          }, {
            swagger: 'http://aa-rm002:7001/api-docs/default/callinfo',
            moduleName: 'Callinfo'
          }, {
            swagger: 'http://aa-rm002:7001/api-docs/default/reference',
            moduleName: 'Reference'
          }],
          model: 'lib/endpointmodel',
          dest: 'lib/endpoint',
        }
      }
    }
  });

  // Load local tasks.
  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task.
  grunt.registerTask('default', ['jshint']);
};