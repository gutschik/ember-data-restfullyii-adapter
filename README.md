ember-data-restfullyii-adapter
==============================

An ember-data adapter for Yii web applications powered by the RESTFullYii API


[![Build Status](https://secure.travis-ci.org/gutschik/ember-data-restfullyii-adapter.png?branch=master)](https://travis-ci.org/gutschik/ember-data-restfullyii-adapter) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

<img src="badge@2x.png" width="130" height="30"> bower install ember-data-restfullyii-adapter

## Install

    npm install bower
    bower install ember-data-restfullyii-adapter
    add the following scripts to your application

    <script type="text/javascript" src="/bower_components/jquery/jquery.min.js"></script>
    <script type="text/javascript" src="/bower_components/handlebars/handlebars.js"></script>
    <script type="text/javascript" src="/bower_components/ember/ember.js"></script>
    <script type="text/javascript" src="/bower_components/ember-data/ember-data.js"></script>
    <script type="text/javascript" src="/bower_components/ember-data-restfullyii-adapter/build/ember-data-restfullyii-adapter.js"></script>

## Motivation
- The [RESTFullYii][RESTFullYii] is a great REST framework for php / yii developers
- The default `ember-data` `RESTAdapter` does not follow the conventions used by the RESTFullYii-framework
- Instead of forcing the yii developer to adapt RESTFullYii to ember-data conventions, this adapter does the dirty work.

[RESTFullYii]: https://github.com/evan108108/RESTFullYii

## Usage

#### Javascript side
- Include the `ember-data-restfullyii-adapter.js` after `ember-data.js` in your HTML/build system

Basic code to use it with the last ember-data revision:

      App.ApplicationAdapter = DS.RESTFullYiiAdapter.extend({});

Creating with a namespace that will be used as the root url:

      App.ApplicationAdapter = DS.RESTFullYiiAdapter.extend({
          namespace: 'api'
      });

#### Yii side
This project requires the `starship/RestfullYii` dev-master branch

i) The adapter assumes you have 2 different endpoints per yii model

    class People(generics.ListCreateAPIView):
        model = Person
        serializer_class = PersonSerializer

    class Person(generics.RetrieveUpdateDestroyAPIView):
        model = Person
        serializer_class = PersonSerializer


ii) The above might have a `urls.py` something like the below

    urlpatterns = patterns('',
        url(r'^/people/(?P<pk>\d+)/$', Person.as_view()),
        url(r'^/people/$', People.as_view()),
    )


## Filtering Support
This adapter supports basic query string filtering

On the client side you would apply a filter using the `ember-data` find api (this returns an DS.AdapterPopulatedRecordArray)

    App.Person = DS.Model.extend({
        name: DS.attr('string')
    });
    var people = this.store.find('person', {name: 'Ben'});

Next you need to add a setting to tell the `RestfullYii-framework` that you intend to use this dependency as your filter backend

    REST_FRAMEWORK = {
        'FILTER_BACKEND': 'rest_framework.filters.DjangoFilterBackend'
    }

Now you can apply the filter to your `ListAPIView` or `ListCreateAPIView`

    class People(generics.ListCreateAPIView):
        model = Person
        serializer_class = PersonSerializer
        filter_fields = ('name', )

If you have this setup correctly you should see an ajax request that looks something like the below

    http://localhost:8000/codecamp/people/?name=Ben

To learn more about the filtering options available in the RestfullYii-framework, please refer to the [api-guide][filtering]

[filtering]: https://github.com/evan108108/RESTFullYii#get-request-filtering-results-workcontroller


## Record Nesting
When nesting resources, which is common in many-to-many or foreign-key relationships, the following conventions apply.

Nested endpoints must be list only.  Any nested resources must also have their own top level endpoints for create / update / delete

    class PeopleView(generics.ListCreateAPIView):
        ...
    
    class PersonView(generics.RetrieveUpdateDestroyAPIView):
        ...
    
    class NestedPeopleView(generics.ListAPIView):
        ...
    
    class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
        ...
    
    urlpatterns = patterns('',
        url(r'^/people/$', PeopleView.as_view()),
        url(r'^/people/(?P<pk>\d+)/$', PersonView.as_view()),
        url(r'^/groups/(?P<pk>\d+)/$', GroupDetailView.as_view()),
        url(r'^/groups/(?P<group_pk>\d+)/people/$', NestedPeopleView.as_view()),
    )

Nested endpoints must match their relation field name

    class Person(models.Model):
        name = models.CharField(...)
    
    class Group(models.Model):
        members = models.ManyToManyField(Person)
    
    urlpatterns = patterns('',
        #/groups/:id/people/ WILL NOT WORK
        url(r'^/groups/(?P<group_pk>\d+)/members/$', NestedPeopleView.as_view()),
    )

## CSRF Support
This adapter does not require you send a CSRF token with each $.ajax request

If you want to send the token with each request, add a snippet of javascript to ensure your application adds the csrf token to the http headers

    <script type="text/javascript">
      jQuery(document).ajaxSend(function(event, xhr, settings) {
        if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
          xhr.setRequestHeader("X-CSRFToken", "{{csrf_token}}");
        }
      });
    </script>

## Building ember-data-restfullyii-adapter

To build the minified versions of ember-data-restfullyii-adapter you will need [node.js](http://nodejs.org)

From the main project folder run the command below (This does not require `sudo`)

```shell
npm install
```

At this point the dependencies have been installed and you can build ember-data-restfullyii-adapter

```shell
grunt
```

If you don't have all the node modules available on your path you can do this manually (ie- the grunt command does not work)

```shell
export PATH="./node_modules/.bin:$PATH"
```

## Integration with Ember App Kit

### Install manually

Using Ember Data RESTFullYii Adapter with [Ember App Kit][] is easy!
Add the source file to the `/vendor/` directory, and add an exception to
`.gitignore`:

```
!/vendor/ember-data-restfullyii-adapter.prod.js
```
### Install through bower

```
bower install --save ember-data-restfullyii-adapter
```

### Configure

Then include the adapter in `app/index.html` somewhere after the
Ember Data include:

```html
<script src="/vendor/ember-data-restfullyii-adapter.prod.js"></script>
```

Finally, initialize the adapter by replacing the contents of
`app/adapters/application.js` with:

```js
var AppAdapter = DS.RESTFullYiiAdapter.extend();

export default AppAdapter;
```

And initialize the serializer by adding the file
`app/serializers/application.js` with the contents:

```js
var AppSerializer = DS.RESTFullYiiSerializer.extend();

export default AppSerializer;
```

Your project will now use the RESTFullYii Adapter.  If you are serving
your API on a separate domain (or even a separate PORT!) you will need
to configure this in the adapter instantiation—in
`app/adapters/application.js`.  For example:

```js
var AppAdapter = DS.RESTFullYiiAdapter.extend({
  host: 'http://api.mydomain.com'
});

export default AppAdapter;
```

[Ember App Kit]: https://github.com/stefanpenner/ember-app-kit

## Contributing
This adapter was built by the community for the community. If you would like to extend it or fix a bug, please open an issue or create a pull request. If you can provide a test case for the issue in question, it will help the core team solve the issue more quickly.

## Unit tests

    npm install
    grunt test

## Versions
    ember.js 1.4.0
    ember-data 1.0 beta 7

## Pending Issues

    i) Date and DateTime are not yet built into the adapter (see the WIP PR for a workaround)

    ii) Async belongsTo/hasMany requires a pull-request be merged into ember-data core (see the WIP branch for a workaround)

    iii) Pagination is not yet supported

## Examples
An example project that shows the adapter in action can be found below

https://github.com/gutschik/todo.git

## Credits
I took a large part of this project (including the motivation) from @escalant3 and @toranb

https://github.com/toranb/ember-data-django-rest-adapter/

https://github.com/escalant3/ember-data-tastypie-adapter/

## License
Copyright © 2014 Benjamin Gutschik http://gutschik.de

Licensed under the MIT License


