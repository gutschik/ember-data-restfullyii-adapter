module.exports = function(karma) {
    karma.set({
        basePath: 'tests',

        files: [
          "dist/deps.min.js",
          "helper.js",
          "adapter_tests.js",
          "adapter_embedded_tests.js"
        ],

        logLevel: karma.LOG_ERROR,
//        browsers: ['PhantomJS'],
//        browsers: ['PhantomJS', 'Chrome'],
        browsers: ['Chrome'],
        singleRun: true,
        autoWatch: false,
        background: false,

        frameworks: ['qunit', 'qunit-sb']
    });
};
