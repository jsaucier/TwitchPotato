module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            less: {
                files: ['source/less/*'],
                tasks: ['less:debug']
            },
            main: {
                files: ['source/index.html', 'source/manifest.json'],
                tasks: ['copy:main']
            },
            images: {
                files: ['source/images/*'],
                tasks: ['copy:images']
            }
        },
        copy: {
            main: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: ['source/*.html', 'source/*.json'],
                    dest: 'build/debug/',
                    filter: 'isFile'
                }, {
                    expand: true,
                    flatten: true,
                    src: ['source/*.html', 'source/*.json'],
                    dest: 'build/release/',
                    filter: 'isFile'
                }, {
                    expand: true,
                    flatten: true,
                    src: ['source/scripts/vendor/*.js'],
                    dest: 'build/debug/js/vendor/',
                    filter: 'isFile'
                }, {
                    expand: true,
                    flatten: true,
                    src: ['source/scripts/vendor/*.js'],
                    dest: 'build/release/js/vendor/',
                    filter: 'isFile'
                }]
            },
            images: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: ['source/images/*'],
                    dest: 'build/debug/images/',
                    filter: 'isFile'
                }, {
                    expand: true,
                    flatten: true,
                    src: ['source/images/*'],
                    dest: 'build/release/images/',
                    filter: 'isFile'
                }]
            }
        },
        less: {
            debug: {
                options: {
                    compress: true,
                    yuicompress: true,
                    optimization: 2,
                    sourceMap: true,
                    outputSourceFiles: true,
                },
                files: [{
                    expand: true,
                    cwd: 'source/less',
                    src: '*.less',
                    dest: './build/debug/css/',
                    ext: '.css'
                }]
            },
            release: {
                options: {
                    compress: true,
                    yuicompress: true,
                    optimization: 2,
                    sourceMap: true,
                    outputSourceFiles: true,
                },
                files: [{
                    expand: true,
                    cwd: 'source/less',
                    src: '*.less',
                    dest: './build/release/css/',
                    ext: '.css'
                }]
            },
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['copy:main', 'copy:images', 'less:debug', 'watch']);

};