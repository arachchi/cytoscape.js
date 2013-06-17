'use strict';

module.exports = function(grunt) {

  // Project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      // Description for options are here
      options: {
        "asi": true,
        "laxcomma": true,
        "newcap": false,
        "trailing": true,
        "unused": true,
        "indent": 2,
        "curly": true,
        "undef": true,
        "expr": true,
        "globals": {
          "window": true,
          "jQuery": true,
          "$": true,
          "Raphael": true
        }
      },
      all: ['src/plugins/jquery.cytoscape-navigationpanel.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', [
    'jshint'
  ]);

};
