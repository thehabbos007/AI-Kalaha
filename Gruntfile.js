module.exports = function(grunt) {
    'use strict';

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        watch: {
            css: {
                files: ['css/**/*.css'],
                tasks: ['css']
            },

            livereload: {
                files: ['index.html', 'dist/app.css', 'dist/app.js'],
                options: {
                    livereload: true
                }
            }
        },

        postcss: {
            options: {
                map: true,
                processors: [
                    require('autoprefixer-core')(),
                    require('precss')()
                    //require('cssnano')()
                ]
            },
            dist: {
                src: 'css/app.css',
                dest: 'dist/app.css'
            }
        },

    });

    grunt.registerTask( 'css', ['postcss'] );
    grunt.registerTask( 'default', ['css'] );
};
