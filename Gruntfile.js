'use strict';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
			pkg: grunt.file.readJSON('package.json'),
			sass: { 
				public: {
					files: {
						'public/styles/main.css': 'public/styles/main.scss'
					}
				}
			},
			watch: {
				styles: {
					files: ['public/styles/**/*.scss'],
					tasks: ['sass'],
					options: {
						spawn: false,
					},
				},
			},
			aws: grunt.file.readJSON('.awsDeployKey.json'), // Read the file
			aws_s3: {
				options: {
					accessKeyId: '<%= aws.AWSAccessKeyId %>',
					secretAccessKey: '<%= aws.AWSSecretKey %>',
					region: 'us-west-2',
					sslEnabled: true
				},
				deploySplash: {
					options: {
						bucket: 'www.shouldimine.com',
						differential: true // Only uploads the files that have changed
					},
					files: [{
						action: 'upload',
						expand: true,
						cwd: 'public',
						src: ['**'],
						dest: ''
					}],
				}
			}
		});

		grunt.loadNpmTasks('grunt-contrib-sass');
		grunt.loadNpmTasks('grunt-contrib-watch');
		grunt.loadNpmTasks('grunt-aws-s3');

		// Load the plugin that provides the "uglify" task.
		// grunt.loadNpmTasks('grunt-contrib-uglify');

	};