###
This file contains tasks only necessary for packaging and publishing Chosen
###
module.exports = (grunt) ->

  grunt.config 'dom_munger',
    latest_version:
      src: ['docs/index.html', 'docs/index.proto.html', 'docs/options.html']
      options:
        callback: ($) ->
          $('#latest-version').text(grunt.config.get('version_tag'))

  grunt.config 'zip',
    chosen:
      cwd: 'docs/'
      src: ['docs/**/*']
      dest: 'chosen_<%= version_tag %>.zip'
    build:
      cwd: 'dist/'
      src: ['dist/**/*']
      dest: 'chosen_<%= version_tag %>_dist.zip'

  grunt.registerTask 'prep-release', ['build', 'dom_munger:latest_version', 'zip:chosen', 'zip:build']
