DS.RESTFullYiiSerializer = DS.RESTSerializer.extend({

    init: function() {
        this._super.apply(this, arguments);
    },

    /**
     @method normalizePayload
     @param {subclass of DS.Model} type
     @param {Object} hash
     @returns {Object} the normalized payload
     */
    normalizePayload: function(primaryType, payload) {

        var type = Ember.String.underscore(primaryType.typeKey);
        type = Ember.String.singularize(type);

        if (payload && payload.data && payload.data[type]) {
            payload = payload.data[type];
        }

        return payload;
    },

    /**
     `extractMeta` is used to deserialize any meta information in the
     adapter payload. By default Ember Data expects meta information to
     be located on the `meta` property of the payload object.

     @method extractMeta
     @param {DS.Store} store
     @param {subclass of DS.Model} type
     @param {Object} payload
     */
    extractMeta: function(store, type, payload) {

        if (payload && payload.data && payload.data.totalCount) {
            store.metaForType(type, { total: payload.data.totalCount });  // sets the metadata
            delete payload.data.totalCount;  // keeps ember data from trying to parse "totalCount" as a record
//            delete payload.data;  // keeps ember data from trying to parse "totalCount" as a record
        }
        if (payload && payload.message) {
            delete payload.message;
        }
        if (payload && payload.success) {
            delete payload.success;
        }
    },

    /**
     @method extract
     @param {DS.Store} store
     @param {subclass of DS.Model} type
     @param {Object} payload
     @param {String or Number} id
     @param {String} requestType
     @return {Object} json The deserialized payload
     */
    extract: function(store, type, payload, id, requestType) {

        this.extractMeta(store, type, payload);

        payload = this.normalizePayload(type, payload);

        var specificExtract = "extract" + requestType.charAt(0).toUpperCase() + requestType.substr(1);
        return this[specificExtract](store, type, payload, id, requestType);
    },

    /**
     @method extractRESTFullYiiPayload
     @param {DS.Store} store
     @param {subclass of DS.Model} type
     @param {Object} payload
     */
    extractRESTFullYiiPayload: function(store, type, payload) {

        type.eachRelationship(function(key, relationship) {
            if (!Ember.isNone(payload[key]) &&
                typeof(payload[key][0]) !== 'number' &&
                typeof(payload[key][0]) !== 'string' &&
                relationship.kind === 'hasMany') {
                if (Ember.typeOf(payload[key]) === 'array' && payload[key].length > 0) {
                    var ids = payload[key].mapBy('id'); //todo find pk (not always id)
                    this.pushArrayPayload(store, relationship.type, payload[key]);
                    payload[key] = ids;
                }
            }
            else if (!Ember.isNone(payload[key]) && typeof(payload[key]) === 'object' && relationship.kind === 'belongsTo') {
                var id = payload[key].id;
                this.pushSinglePayload(store, relationship.type, payload[key]);
                payload[key] = id;
            }
        }, this);
    },

    /**
     @method extractSave
     @param {DS.Store} store
     @param {subclass of DS.Model} type
     @param {Object} payload
     @return {Object} json The deserialized payload
     */
    extractSave: function(store, primaryType, payload) {

        this.normalize(primaryType, payload);
        this.extractRESTFullYiiPayload(store, primaryType, payload);
        return payload;
    },

    /**
     @method extractDeleteRecord
     @param {DS.Store} store
     @param {subclass of DS.Model} type
     @param {Object} payload
     @return {Object} json The deserialized payload
     */
    extractDeleteRecord: function(store, type, payload) {

        return null;
//        return this.extractSave(store, type, payload);
    },

    /**
     @method extractSingle
     @param {DS.Store} store
     @param {subclass of DS.Model} type
     @param {Object} payload
     @return {Object} json The deserialized payload
     */
    extractSingle: function(store, primaryType, payload) {

        this.normalize(primaryType, payload);
        this.extractRESTFullYiiPayload(store, primaryType, payload);
        return payload;
    },

    /**
     @method extractFindAll
     @param {DS.Store} store
     @param {subclass of DS.Model} type
     @param {Object} payload
     @return {Array} array An array of deserialized objects
     */
    extractFindAll: function(store, primaryType, payload) {

        var self = this;
        for (var j = 0; j < payload.length; j++) {
            // using normalize from RESTSerializer applies transforms and allows
            // us to define keyForAttribute and keyForRelationship to handle
            // camelization correctly.
            this.normalize(primaryType, payload[j]);
            self.extractRESTFullYiiPayload(store, primaryType, payload[j]);
        }
        return payload;
    },

    /**
     @method extractArray
     @param {DS.Store} store
     @param {subclass of DS.Model} type
     @param {Object} payload
     @return {Array} array An array of deserialized objects
     */
    extractArray: function(store, primaryType, payload) {

        var self = this;
        for (var j = 0; j < payload.length; j++) {
            // using normalize from RESTSerializer applies transforms and allows
            // us to define keyForAttribute and keyForRelationship to handle
            // camelization correctly.
            this.normalize(primaryType, payload[j]);
            self.extractRESTFullYiiPayload(store, primaryType, payload[j]);
        }
        return payload;
    },

    /**
     This method allows you to push a single object payload.

     It will first normalize the payload, so you can use this to push
     in data streaming in from your server structured the same way
     that fetches and saves are structured.

     @param {DS.Store} store
     @param {String} type
     @param {Object} payload
     */
    pushSinglePayload: function(store, type, payload) {
        type = store.modelFor(type);
        payload = this.extract(store, type, payload, null, "find");
        store.push(type, payload);
    },

    /**
     This method allows you to push an array of object payloads.

     It will first normalize the payload, so you can use this to push
     in data streaming in from your server structured the same way
     that fetches and saves are structured.

     @param {DS.Store} store
     @param {String} type
     @param {Object} payload
     */
    pushArrayPayload: function(store, type, payload) {
        type = store.modelFor(type);
        payload = this.extract(store, type, payload, null, "findAll");
        store.pushMany(type, payload);
    },

    /**
     Converts camelcased attributes to underscored when serializing.

     Stolen from DS.ActiveModelSerializer.

     @method keyForAttribute
     @param {String} attribute
     @returns String
     */
    keyForAttribute: function(attr) {
        return Ember.String.decamelize(attr);
    },

    /**
     Underscores relationship names and appends "_id" or "_ids" when serializing
     relationship keys.

     @method keyForRelationship
     @param {String} key
     @param {String} kind
     @return String
     */
    keyForRelationship: function(key, kind) {
        key = Ember.String.decamelize(key);
        if (kind === "belongsTo") {
            return key + "_id";
        } else if (kind === "hasMany") {
//            debugger;
            return key;
//            return Ember.String.singularize(key);
//            return Ember.String.singularize(key) + "_ids";
        } else {
//            debugger;
            return key;
        }
    },

    /**
     @method serialize
     @param {subclass of DS.Model} record
     @param {Object} options
     @return {Object} json
     */
    serialize: function(record, options) {

        var json = {};

        if (options && options.includeId) {
            var id = get(record, 'id');

            if (id) {
                json[get(this, 'primaryKey')] = id;
            }
        }

        record.eachAttribute(function(key, attribute) {
            this.serializeAttribute(record, json, key, attribute);
        }, this);

        record.eachRelationship(function(key, relationship) {
            if (relationship.kind === 'belongsTo') {
                this.serializeBelongsTo(record, json, relationship);
            } else if (relationship.kind === 'hasMany') {
                this.serializeHasMany(record, json, relationship);
            }
        }, this);

        return json;
    },

    /**
     Underscore relationship names when serializing belongsToRelationships

     @method serializeBelongsTo
     */
    serializeBelongsTo: function(record, json, relationship) {

        var key = relationship.key;
        var belongsTo = record.get(key);
        var json_key = this.keyForRelationship ? this.keyForRelationship(key, "belongsTo") : key;

        if (Ember.isNone(belongsTo)) {
            json[json_key] = belongsTo;
        } else {
            if (typeof(record.get(key)) === 'string') {
                json[json_key] = record.get(key);
            } else {
                json[json_key] = record.get(key).get('id');
            }
        }

        if (relationship.options.polymorphic) {
            this.serializePolymorphicType(record, json, relationship);
        }
    },

    /**
     Underscore relationship names when serializing hasManyRelationships

     @method serializeHasMany
     */
    serializeHasMany: function(record, json, relationship) {

        var key = relationship.key,
      attrs = Ember.get(this, 'attrs'),
      embed = attrs && attrs[key] && attrs[key].embedded === 'always',
            json_key = this.keyForRelationship(key, "hasMany"),
            relationshipType = DS.RelationshipChange.determineRelationshipType(
                record.constructor, relationship);

        if (relationshipType === 'manyToNone' ||
      relationshipType === 'manyToMany') {
            json[json_key] = record.get(key).mapBy('id');
    }

    if (embed) {
      json[this.keyForAttribute(key)] = Ember.get(record, key).map(function(relation) {
        var data = relation.serialize(),
          primaryKey = Ember.get(this, 'primaryKey');

        data[primaryKey] = Ember.get(relation, primaryKey);

        return data;
      }, this);

      // remove newly created sub-resources to avoid duplicate entries since they
      // will bei returned with an id from the REST API anyways
      record.get(key).filterBy('isNew').forEach(function(item) {
//          debugger;
        item.deleteRecord();
      });

    }
  }

});
