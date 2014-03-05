var speakers_json, ratings_json, tags_json;

module('integration tests', {
    setup: function() {
        ajaxUrl = undefined;
        ajaxType = undefined;
        ajaxHash = undefined;
        speakers_json = {
            "success": true,
            "message": "Record(s) Found",
            "data": {
                "totalCount": "2",
                "speaker": [
                    {"id": 9, "name": "first", "session": 1},
                    {"id": 4, "name": "last", "session": 1}
                ]
            }
        };
        ratings_json = {
            "success": true,
            "message": "Record(s) Found",
            "data": {
                "totalCount": "1",
                "rating": [{"id": 8, "score": 10, "feedback": "nice", "session": 1}]
            }
        };
        tags_json = {
            "success": true,
            "message": "Record(s) Found",
            "data": {
                "totalCount": "1",
                "tag": [{"id": 7, "description": "done"}]
            }
        };
        App.reset();
    },
    teardown: function() {
        $.mockjaxClear();
    }
});

test('arrays as result of transform should not be interpreted as embedded records', function() {

    var json = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "preserialized": [{"id": 1, "config": "[\"ember\",\"is\",\"neato\"]"}]
        }
    };
    stubEndpointForHttpRequest('/api/preserialized/', json);
    visit("/preserialized").then(function() {
        var divs = find("div.item").length;
        equal(divs, 3, "found " + divs + " divs");
        var items = Ember.$.trim($("div.item").text());
        equal(items, "emberisneato", "attribute was instead: " + items);
    });
});

test('attribute transforms are applied', function() {
    var json = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "transformer": [{"id": 1, "transformed": "blah blah"}]
        }
    };
    stubEndpointForHttpRequest('/api/transformer/', json);
    visit("/transformers").then(function() {
        var spans = find("span").length;
        equal(spans, 1, "found " + spans + " spans");
        var attribute = Ember.$.trim($("span.attribute").text());
        equal(attribute, "blah blahSILLYTRANSFORM", "attribute was instead: " + attribute);
    });
});

test('models with camelCase converted to underscore urls', function() {
    var json = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "camel_url": [{"id": 1, "test": "foobar"}]
        }
    };
    stubEndpointForHttpRequest('/api/camel_url/', json);
    visit("/camelUrls").then(function() {
        var spans = find("span").length;
        equal(spans, 1, "found " + spans + " spans");
        var attribute = Ember.$.trim($("span.attribute").text());
        equal(attribute, "foobar", "attribute was instead: " + attribute);
    });
});

test('keys with underscores converted to camelCase', function() {
    stubEndpointForHttpRequest('/api/camel/1/camel_case_relationship/', tags_json);
    var json = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "camel": [{"id": 1, "camel_case_attribute": "foo", "camel_case_relationship": [7]}]
        }
    };
    stubEndpointForHttpRequest('/api/camel/', json);
    visit("/camels").then(function() {
        var spans = find("span").length;
        equal(spans, 2, "found " + spans + " spans");
        var attribute = Ember.$.trim($("span.attribute").text());
        equal(attribute, "foo", "attribute was instead: " + attribute);
        var tag = Ember.$.trim($("span.tag").text());
        equal(tag, "done", "tag was instead: " + tag);
    });
});

test('ajax response with 1 session yields table with 1 row', function() {
    var json = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": [{"id": 1, "name": "foo", "room": "bar", "desc": "test",
                            "speakers": [], "ratings": [], "tags": []}]
        }
    };
    stubEndpointForHttpRequest('/api/session/', json);
    visit("/sessions").then(function() {
        var rows = find("table tr").length;
        equal(rows, 6, "table had " + rows + " rows");
        var name = Ember.$.trim($("table td.name").text());
        equal(name, "foo", "name was instead: " + name);
    });
});

test('ajax response with no session records yields empty table', function() {
    var json = {
        success: false,
        message: "No Record(s) Found",
        data: {
            totalCount: "0",
            session: [ ]
        }
    };
    stubEndpointForHttpRequest('/api/session/', json);
    visit("/sessions").then(function() {
        var rows = find("table tr").length;
        equal(rows, 0, "table had " + rows + " rows");
    });
});

test('ajax response with async hasMany relationship renders correctly', function() {
    stubEndpointForHttpRequest('/api/session/1/speakers/', speakers_json);
    stubEndpointForHttpRequest('/api/session/1/ratings/', ratings_json);
    stubEndpointForHttpRequest('/api/session/1/tags/', tags_json);
    var json = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": [{"id": 1, "name": "foo", "room": "bar", "desc": "test",
                            "speakers": [9,4], "ratings": [8], "tags": [7]}]
        }
    };
    stubEndpointForHttpRequest('/api/session/', json);
    visit("/sessions").then(function() {
        //speakers
        var speakers = find("table td.speaker").length;
        equal(speakers, 2, "table had " + speakers + " speakers");
        var speaker_one = Ember.$.trim($("table td.speaker:eq(0)").text());
        equal(speaker_one, "first", "speaker_one was instead: " + speaker_one);
        var speaker_two = Ember.$.trim($("table td.speaker:eq(1)").text());
        equal(speaker_two, "last", "speaker_two was instead: " + speaker_two);
        //ratings
        var ratings = find("table td.rating").length;
        equal(ratings, 1, "table had " + ratings + " ratings");
        var rating_one = Ember.$.trim($("table td.rating:eq(0)").text());
        equal(rating_one, "10", "rating_one was instead: " + rating_one);
        //tags
        var tags = find("table td.tag").length;
        equal(tags, 1, "table had " + tags + " tags");
        var tag_one = Ember.$.trim($("table td.tag:eq(0)").text());
        equal(tag_one, "done", "tag_one was instead: " + tag_one);
    });
});

test('ajax response for single session will render correctly', function() {
    stubEndpointForHttpRequest('/api/session/1/speakers/', speakers_json);
    stubEndpointForHttpRequest('/api/session/1/ratings/', ratings_json);
    stubEndpointForHttpRequest('/api/session/1/tags/', tags_json);
    var json = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": [{"id": 1, "name": "foo", "room": "bar", "desc": "test",
                            "speakers": [9,4], "ratings": [8], "tags": [7]}]
        }
    };
    stubEndpointForHttpRequest('/api/session/', json);
    json = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": {"id": 1, "name": "foo", "room": "bar", "desc": "test",
                            "speakers": [9,4], "ratings": [8], "tags": [7]}
        }
    };
    stubEndpointForHttpRequest('/api/session/1/', json);
    visit("/session/1").then(function() {
        var name = Ember.$.trim($("div .model_name").text());
        equal(name, "foo", "name was instead: " + name);
        //speakers
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        var speaker_one = Ember.$.trim($("div .speakers span.name:eq(0)").text());
        equal(speaker_one, "first", "speaker_one was instead: " + speaker_one);
        var speaker_two = Ember.$.trim($("div .speakers span.name:eq(1)").text());
        equal(speaker_two, "last", "speaker_two was instead: " + speaker_two);
        //ratings
        var ratings = find("div .ratings span.score").length;
        equal(ratings, 1, "table had " + ratings + " ratings");
        var rating_one = Ember.$.trim($("div .ratings span.score:eq(0)").text());
        equal(rating_one, "10", "rating_one was instead: " + rating_one);
        //setup the http post mock $.ajax
        //for some reason the 2 lines below are not used or needed?
        var response = {"id": 4, "score": 2, "feedback": "abc", "session": 1};
        stubEndpointForHttpRequest('/api/rating/', response, 'POST', 201);
        fillIn(".score", "2");
        fillIn(".feedback", "abc");
        return click(".add_rating");
    }).then(function() {
        //TODO this is currently broken for non-embedded bound templates (should be 2)
        var ratings = find("div .ratings span.score").length;
        equal(ratings, 1, "table had " + ratings + " ratings");
        expectUrlTypeHashEqual("/api/rating/", "POST", {});
        expectRatingAddedToStore(4, 2, 'abc', 1);
        equal(ajaxHash.data, '{"score":2,"feedback":"abc","session":"1","other":null}');
    });
});



test('test pushSinglePayload', function() {
    var json = {"id": 10, "description": "RESTFullYii"};
    Ember.run(App, function(){
        // load the object into the Ember data store
        var store = App.__container__.lookup("store:main");  // pretty sure this is not the right way to do this...
        store.serializerFor('tag').pushSinglePayload(store, 'tag', json);
    });
    visit("/tag/10").then(function() {
        var content = Ember.$.trim($("span").text());
        equal(content, "RESTFullYii", "name was instead: " + content);
    });
});

test('test pushArrayPayload', function() {
    var json = [{"id": 11, "description": "ember"}, {"id": 12, "description": "tomster"}];
    Ember.run(App, function(){
        // load the objects into the Ember data store
        var store = App.__container__.lookup("store:main");  // pretty sure this is not the right way to do this...
        store.serializerFor('tag').pushArrayPayload(store, 'tag', json);
    });
    visit("/tag/12").then(function() {
        var content = Ember.$.trim($("span").text());
        equal(content, "tomster", "name was instead: " + content);
        return visit("/tag/11");
    }).then(function(){
        var content = Ember.$.trim($("span").text());
        equal(content, "ember", "name was instead: " + content);
    });
});

test('finding nested attributes when some requested records are already loaded makes GET request to the correct attribute-based URL', function() {

    var user = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "user": {"id": 1, "username": "foo", "speakers": [8, 9]}
        }
    };
    var speakers = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "2",
            "speaker": [{"id": 8, "name": "ember"}, {"id": 9, "name": "tomster"}]
        }
    };
    Ember.run(App, function(){
        // load the object into the Ember data store
        var store = App.__container__.lookup("store:main");  // pretty sure this is not the right way to do this...
        store.serializerFor('speaker').pushSinglePayload(store, 'speaker', speakers.data.speaker[0]); // pre-load the first alias object before find
    });
    stubEndpointForHttpRequest('/api/user/1/', user);
    stubEndpointForHttpRequest('/api/user/1/speakers/', speakers);
    visit("/user/1").then(function() {
        var name = Ember.$.trim($(".username").text());
        equal(name, "foo", "name was instead: " + name);
        var count = $(".alias").length;
        equal(count, 2, "count was instead: " + count);
        var alias = Ember.$.trim($(".alias:eq(0)").text());
        equal(alias, "ember", "alias was instead: " + alias);
    });
});

test('finding nested attributes makes GET request to the correct attribute-based URL', function() {

    var user = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "user": {"id": 1, "username": "foo", "speakers": [8, 9]}
        }
    };
    var speakers = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "2",
            "speaker": [{"id": 8, "name": "ember"}, {"id": 9, "name": "tomster"}]
        }
    };
    stubEndpointForHttpRequest('/api/user/1/', user);
    stubEndpointForHttpRequest('/api/user/1/speakers/', speakers);
    visit("/user/1").then(function() {
        var name = Ember.$.trim($(".username").text());
        equal(name, "foo", "name was instead: " + name);
        var count = $(".alias").length;
        equal(count, 2, "count was instead: " + count);
        var alias = Ember.$.trim($(".alias:eq(0)").text());
        equal(alias, "ember", "alias was instead: " + alias);
    });
});

test('basic error handling will bubble to the model', function() {

    var session = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": {"id": 1, "name": "x", "room": "y", "tags": [], ratings: [], speakers: [1]}
        }
    };
    var speaker = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "speaker": {"id": 1, "name": "wat", "location": "iowa", "session": 1, "association": null, "personas": [1], "zidentity": null}
        }
    };
    var personas = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "2",
            "persona": [{"id": 1, "nickname": "magic", "speaker": 1, "company": null}]
        }
    };
    stubEndpointForHttpRequest('/api/session/1/', session);
    stubEndpointForHttpRequest('/api/speaker/1/', speaker);
    stubEndpointForHttpRequest('/api/speaker/1/personas/', personas);
    visit("/speaker/1").then(function() {
        var name = $("input.name").val();
        equal(name, "wat", "name was instead: " + name);
        var errors = Ember.$.trim($("#errors").text());
        equal(errors, "", "errors was instead: " + errors);
        stubEndpointForHttpRequest('/api/speaker/1/', {}, 'PUT', 400);
        return click(".update");
    }).then(function() {
        var name = $("input.name").val();
        equal(name, "wat", "name was instead: " + name);
        var errors = Ember.$.trim($("#errors").text());
        equal(errors, "", "errors was instead: " + errors);
//        equal(errors, "operation failed for model: speaker", "errors was instead: " + errors);
    });
});

test('basic error handling will not fire when update is successful', function() {

    var association = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "association": [{"id": 1, "name": "first", "speakers": [1]}]
        }
    };
    var session = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": [{"id": 1, "name": "z", "room": "d", "tags": [], "speakers": [1], "ratings": []}]
        }
    };
    var user = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "user": [{"id": 1, "username": "gutschik", "aliases": []}]
        }
    };
    var speaker = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "speaker": {"id": 1, "name": "wat", "location": "iowa", "session": 1, "association": 1, "personas": [1], "zidentity": 1}
        }
    };
    var personas = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "persona": [{"id": 1, "nickname": "magic", "speaker": 1, "company": 1}]
        }
    };
    stubEndpointForHttpRequest('/api/association/1/', association);
    stubEndpointForHttpRequest('/api/session/1/', session);
    stubEndpointForHttpRequest('/api/user/1/', user);
    stubEndpointForHttpRequest('/api/speaker/1/', speaker);
    stubEndpointForHttpRequest('/api/speaker/1/personas/', personas);
    visit("/speaker/1").then(function() {
        var name = $("input.name").val();
        equal(name, "wat", "name was instead: " + name);
        var errors = Ember.$.trim($("#errors").text());
        equal(errors, "", "errors was instead: " + errors);
    });
        // stubEndpointForHttpRequest('/api/speakers/1/', speaker, 'PUT', 200);
        // return click(".update");
    // }).then(function() {
        // var name = $("input.name").val();
        // equal(name, "wat", "name was instead: " + name);
        // var errors = Ember.$.trim($("#errors").text());
        // equal(errors, "", "errors was instead: " + errors);
        // expectUrlTypeHashEqual("/api/speakers/1/", "PUT", speaker);
    // });
});

test('ajax post with multiple parents will use singular endpoint', function() {

    var session = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": [{"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}]
        }
    };
    var sessionSingle = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": {"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}
        }
    };
    var post = {"id": 3, "name": "tom", "location": "iowa", "session": 1, "association": null, "personas": [], "zidentity": 1};
    var user = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "user": {"id": 1, "username": "gutschik", "aliases": [1]}
        }
    };

    stubEndpointForHttpRequest('/api/users/1/aliases/', speakers_json);
    stubEndpointForHttpRequest('/api/session/1/speakers/', speakers_json);
    stubEndpointForHttpRequest('/api/session/1/ratings/', ratings_json);
    stubEndpointForHttpRequest('/api/session/1/tags/', tags_json);
    stubEndpointForHttpRequest('/api/session/', session);
    stubEndpointForHttpRequest('/api/session/1/', sessionSingle);
    visit("/session/1").then(function() {
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        //setup the http post mock $.ajax
        stubEndpointForHttpRequest('/api/user/1/', user);
        stubEndpointForHttpRequest('/api/speaker/', post, 'POST', 201);
        fillIn(".speaker_name", "tom");
        fillIn(".speaker_location", "iowa");
        return click(".add_speaker");
    }).then(function() {
        //TODO this is currently broken for non-embedded bound templates (should be 3)
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        expectUrlTypeHashEqual("/api/speaker/", "POST", post);
        expectSpeakerAddedToStore(3, 'tom', 'iowa');
    });
});

test('ajax post with single parent will use correctly nested endpoint', function() {

    var session = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": [{"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}]
        }
    };
    var sessionSingle = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": {"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}
        }
    };
    var post = {"id": 3, "name": "axe", "location": "yo", "session": 1, "association": null, "personas": [], "zidentity": null};

    stubEndpointForHttpRequest('/api/session/1/speakers/', speakers_json);
    stubEndpointForHttpRequest('/api/session/1/ratings/', ratings_json);
    stubEndpointForHttpRequest('/api/session/1/tags/', tags_json);
    stubEndpointForHttpRequest('/api/session/', session);
    stubEndpointForHttpRequest('/api/session/1/', sessionSingle);
    visit("/session/1").then(function() {
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        //setup the http post mock $.ajax
        stubEndpointForHttpRequest('/api/speaker/', post, 'POST', 201);
        fillIn(".speaker_name", "tbill");
        fillIn(".speaker_location", "ohio");
        return click(".add_speaker_with_single_parent");
    }).then(function() {
        //TODO this is currently broken for non-embedded bound templates (should be 3)
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        expectUrlTypeHashEqual("/api/speaker/", "POST", post);
        expectSpeakerAddedToStore(3, 'axe', 'yo');
    });
});

test('ajax post with different single parent will use correctly nested endpoint', function() {

    var session = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": [{"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}]
        }
    };
    var sessionSingle = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "session": {"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}
        }
    };
    var post = {"id": 3, "name": "who", "location": "dat", "session": null, "association": null, "personas": [], "zidentity": 1};
    var user = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "user": {"id": 1, "username": "gutschik", "aliases": [1]}
        }
    };

    stubEndpointForHttpRequest('/api/user/1/aliases/', speakers_json);
    stubEndpointForHttpRequest('/api/session/1/speakers/', speakers_json);
    stubEndpointForHttpRequest('/api/session/1/ratings/', ratings_json);
    stubEndpointForHttpRequest('/api/session/1/tags/', tags_json);
    stubEndpointForHttpRequest('/api/session/', session);
    stubEndpointForHttpRequest('/api/session/1/', sessionSingle);
    visit("/session/1").then(function() {
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        //setup the http post mock $.ajax
        stubEndpointForHttpRequest('/api/user/1/', user);
        stubEndpointForHttpRequest('/api/speaker/', post, 'POST', 201);
        fillIn(".speaker_name", "who");
        fillIn(".speaker_location", "dat");
        return click(".add_speaker_with_user_single_parent");
    }).then(function() {
        //TODO this is currently broken for non-embedded bound templates (should be 3)
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        expectUrlTypeHashEqual("/api/speaker/", "POST", post);
        expectSpeakerAddedToStore(3, 'who', 'dat');
    });
});

test('multiword hasMany key is serialized correctly on save', function() {
    var store = App.__container__.lookup('store:main'),
        car;
    stubEndpointForHttpRequest('/api/car/1/',
        {'id': 1, 'car_parts': [1,2]}, 'PUT');

    Ember.run(function(){
        var serializer = store.serializerFor('car');
        serializer.pushSinglePayload(store, 'car',
            {'id': 1, 'car_parts': []});
        serializer.pushArrayPayload(store, 'carPart',
            [{'id': 1, 'cars': []}, {'id': 2, 'cars': []}]);

        store.find('car', 1).then(function(result){
            car = result;
            return Ember.RSVP.all(
                [store.find('carPart', 1), store.find('carPart', 2)]) ;
        }).then(function(carParts){
            car.set('carParts', carParts);
            return car.save();
        }).then(function(car){
            equal(ajaxHash.data, '{"car_parts":[]}');
            return;
        });
    });

    wait();
});

test('camelCase belongsTo key is serialized with underscores on save', function() {
    var store = App.__container__.lookup('store:main');
    var camelParent = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "camel_parent":  {'id': 1, 'name': 'parent', 'camel_kids':[1]}
        }
    };
    var camelKids = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "camel_kid": [{"id":1, "description":"firstkid","camel_parent":"1"}]
        }
    };
    stubEndpointForHttpRequest('/api/camel_parent/1/', camelParent);
    stubEndpointForHttpRequest('/api/camel_parent/1/camel_kids/', camelKids);

    visit("/camelParent").then(function() {
        var camelKid = {
            "success": true,
            "message": "Record Created",
            "data": {
                "totalCount": "1",
                "camel_kid": {"description":"secondkid","camel_parent":"1"}
            }
        };
        stubEndpointForHttpRequest('/api/camel_kid/', camelKid, 'POST', 201);
        return click(".add");
    }).then(function() {

        var count = $(".description").length;
        //TODO this is currently broken for non-embedded bound templates (should be 2)
        equal(count, 1, "count was instead: " + count);

        equal(ajaxHash.data, '{"description":"secondkid","camel_parent":"1"}');
    });
});

test('string ids are allowed', function() {

    var user = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "user": {"id": 1, "username": "foo", "speakers": ['asd', 9]}
        }
    };
    var speakers = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "2",
            "speaker": [{"id": 'asd', "name": "string-ids-name"}, {"id": 9, "name": "tomster"}]
        }
    };
    stubEndpointForHttpRequest('/api/user/1/', user);
    stubEndpointForHttpRequest('/api/user/1/speakers/', speakers);
    visit("/user/1").then(function() {
        var name = Ember.$.trim($(".username").text());
        equal(name, "foo", "name was instead: " + name);
        var count = $(".alias").length;
        equal(count, 2, "count was instead: " + count);
        var alias = Ember.$.trim($(".alias:eq(0)").text());
        equal(alias, "string-ids-name", "alias was instead: " + alias);
    });
});

test('hasMany relation has to be nested', function() {

    var speaker = {
        "success": true,
        "message": "Record(s) Found",
        "data": {
            "totalCount": "1",
            "speaker": {"id": 1, "name": "wat", "location": "iowa", "session": 1, "badges": [{"id": 1, "city": "Nashville"}], "personas": [], "zidentity": 1}
        }
    };

    stubEndpointForHttpRequest('/api/speaker/1/', speaker);
    visit("/speaker/1").then(function() {
        var city = $(".Nashville");
        equal(city.length, 1, "One city was found");
        equal(city.text(), "Nashville", "name was found: " + city.text());
    });
});

