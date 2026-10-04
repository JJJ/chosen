###
This file contains tasks only necessary for packaging and publishing Chosen
###
module.exports = (grunt) ->

  grunt.registerTask 'check-demo-version', ->
    require('../scripts/check-demo-version')()

  grunt.config 'zip',
    chosen:
      cwd: 'docs/'
      src: ['docs/**/*']
      dest: 'chosen_<%= version_tag %>.zip'
    build:
      cwd: 'dist/'
      src: ['dist/**/*']
      dest: 'chosen_<%= version_tag %>_dist.zip'

  grunt.registerTask 'prep-release', ['build', 'check-demo-version', 'zip:chosen', 'zip:build']
