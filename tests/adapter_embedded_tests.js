module('embedded integration tests', {
    setup: function() {
        ajaxUrl = undefined;
        ajaxType = undefined;
        ajaxHash = undefined;
        App.reset();
    },
    teardown: function() {
        $.mockjaxClear();
    }
});

test('ajax response with array of embedded records renders hasMany correctly', function() {
    var json = [{"id": 1, "hat": "zzz", "speakers": [{"id": 1, "name": "first", "other": 1}], "ratings": [{"id": 1, "score": 10, "feedback": "nice", "other": 1}], "tags": [{"id": 1, "description": "done"}], "location": {"id": 1, "name": "US"}}];

    stubEndpointForHttpRequest('/api/others/', json);
    visit("/others").then(function() {
        var rows = find("table tr").length;
        equal(rows, 4, "table had " + rows + " rows");
        var hat = Ember.$.trim($("table tr:eq(0) td:eq(0)").text());
        var speaker = Ember.$.trim($("table tr:eq(1) td:eq(0)").text());
        var tag = Ember.$.trim($("table tr:eq(2) td:eq(0)").text());
        equal(hat, "zzz", "(other) hat was instead: " + hat);
        equal(speaker, "first", "speaker was instead: " + speaker);
        equal(tag, "done", "tag was instead: " + tag);
    });
});

test('ajax response with no embedded records yields empty table', function() {
    stubEndpointForHttpRequest('/api/others/', []);
    visit("/others").then(function() {
        var rows = find("table tr").length;
        equal(rows, 0, "table had " + rows + " rows");
    });
});

test('ajax response with single embedded record renders hasMany correctly', function() {
    var json = {"id": 1, "hat": "eee", "speakers": [{"id": 1, "name": "first", "other": 1}], "ratings": [{"id": 1, "score": 10, "feedback": "nice", "other": 1}], "tags": [{"id": 1, "description": "done"}], "location": {"id": 1, "name": "US"}};
    stubEndpointForHttpRequest('/api/others/1/', json);
    visit("/other/1").then(function() {
        var hat = Ember.$.trim($("div .hat").text());
        equal(hat, "eee", "hat was instead: " + hat);
        var speaker = Ember.$.trim($("div .name").text());
        equal(speaker, "first", "speaker was instead: " + speaker);
        var tag = Ember.$.trim($("div .description").text());
        equal(tag, "done", "tag was instead: " + tag);
    });
});

test('ajax response with single embedded record renders belongsTo correctly', function() {
    var json = {"id": 1, "hat": "eee", "speakers": [{"id": 1, "name": "first", "other": 1}], "ratings": [{"id": 1, "score": 10, "feedback": "nice", "other": 1}], "tags": [{"id": 1, "description": "done"}], "location": {"id": 1, "name": "US"}};
    stubEndpointForHttpRequest('/api/others/1/', json);
    visit("/other/1").then(function() {
        var location = Ember.$.trim($("div .location").text());
        equal(location, "US", "location was instead: " + location);
    });
});

test('add rating will do http post and append rating to template', function() {
    var json = {"id": 1, "hat": "eee", "speakers": [{"id": 1, "name": "first", "other": 1}], "ratings": [{"id": 1, "score": 10, "feedback": "nice", "other": 1}], "tags": [{"id": 1, "description": "done"}], "location": {"id": 1, "name": "US"}};
    var rating = {"id": 3, "score": 4, "feedback": "def", "other": 1};
    stubEndpointForHttpRequest('/api/others/1/', json);
    visit("/other/1").then(function() {
        var before = find("div .ratings span.score").length;
        equal(before, 1, "initially the table had " + before + " ratings");
        //setup the http post mock $.ajax
        //for some reason the 2 lines below are not used or needed?
        stubEndpointForHttpRequest('/api/ratings/', rating, 'POST', 201);
        fillIn(".score", "4");
        fillIn(".feedback", "def");
        return click(".add_rating");
    }).then(function() {
        var after = find("div .ratings span.score").length;
        equal(after, 2, "table had " + after + " ratings after create");
        expectUrlTypeHashEqual("/api/ratings/", "POST", rating);
        expectRatingAddedToStore(3, 4, 'def', 1, 'other');
    });
});
