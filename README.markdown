### Backbone <-> Firebase 0.0.3

This script does two things:

* Overloads Backbone.sync to use Firebase instead of AJAX.
* Adds a BackboneFirebase object which keeps a collection in sync with Firebase

#### Getting started:

1. Include backbone-firebase.js in your project.
2. Set BackboneFirebase.DEFAULT_INSTANCE to your Firebase URL
3. By default all models/collections will persist to Firebase based on the URL path of the model/collection.

Example:

```javascript
    BackboneFirebase.DEFAULT_INSTANCE = 'https://YOURDB.firebaseio.com';

    var Post = Backbone.Model.extend({
      idAttribute: '_firebase_name',
      url: '/posts'
    });
    
    var collection = Backbone.Collection.extend({
      model: Post,
      url: "/posts",

      initialize: function() {
        this.backboneFirebase = new BackboneFirebase(this);
      }
    });
```

#### Advanced Examples

Overriding the model's default path ( model.url + '/' + model.id ) with something fancy:

```javascript
   var WackyPost = Backbone.Model.extend({
      idAttribute: '_firebase_name',
      url: function() {
         return '/posts/'+(Math.random() * 100 + 1); // pick a random record because we like being wacky
      }
   });
```

Using multiple Firebase instances:

```javascript
    var collectionOne = Backbone.Collection.extend({
      model: Post,
      url: "/posts1",

      initialize: function() {
        this.backboneFirebase = new BackboneFirebase(this, {urlPrefix: 'http://DB_ONE.firebaseio.com'});
      }
    });

    var collectionTwo = Backbone.Collection.extend({
      model: Post,
      url: "/posts2",

      initialize: function() {
        this.backboneFirebase = new BackboneFirebase(this, {urlPrefix: 'http://DB_TWO.firebaseio.com'});
      }
    });
```

Using the orginal Backbone.sync (AJAX) in tandem with Firebase:

```javascript
    // Declare the sync resource to override BackboneFirebase
    var Post = Backbone.Model.extend({
      sync:  Backbone.sync_AJAX
    });
```

Unbind Firebase callbacks (stop monitoring data and using resources) if a collection is no longer needed:

```javascript
   // inside Backbone.Collection
   initialize: function() {
      this.backboneFirebase = new new BackboneFirebase(this, {urlPrefix: 'http://DB_ONE.firebaseio.com'});
   }

   destroy: function() {
      this.backboneFirebase.dispose();
   }
```

Questions? Comments? [Let me know](https://github.com/alexbain/backbone-firebase/issues)!
