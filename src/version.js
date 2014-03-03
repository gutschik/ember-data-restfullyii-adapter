var VERSION = "RESTFULLYII-ADAPTER-VERSION";

DS.RESTFullYiiSerializer.VERSION = VERSION;
DS.RESTFullYiiAdapter.VERSION = VERSION;

if (Ember.libraries) {
  Ember.libraries.register("ember-data-restfullyii-adapter", VERSION);
}

