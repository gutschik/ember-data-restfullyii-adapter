module.exports = {
    update_version: {
      src: 'dist/ember-data-restfullyii-adapter.js',
      overwrite: true,
      replacements: [{
        from: 'RESTFULLYII-ADAPTER-VERSION',
        to: '<%= package.version %>'
      }]
    },
// modeled after https://github.com/emberjs/ember-dev/blob/master/lib/ember-dev/rakep/filters.rb#L6
// for some reason the start '^' and end of line '$' do not work in these regexes
    strip_debug_messages_production: {
        src: 'dist/ember-data-restfullyii-adapter.js',
        dest: 'dist/ember-data-restfullyii-adapter.prod.js',
        replacements: [{
            from: /Ember.(assert|deprecate|warn|debug)\(.*\)/g,
            to: ''
        }]
    }
}
