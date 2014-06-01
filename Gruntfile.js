module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('./package.json'),
    concat: {
      options: {
        banner: '/*! <%= pkg.name %> \n by @spencermountain\n <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        footer: ""
      },
      dist: {
        src: [
          './src/treemap/d3treemap.js',
          'src/scale/coffeejs/scale.js',
          'src/coffeejs/clooney.js',
        ],
        dest: './build/clooney.js'
      }
    },
    uglify: {
      do :{
        src: ['./build/clooney.js'],
        dest: './build/clooney.min.js'
      }
    }

  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['concat', 'uglify']);

};