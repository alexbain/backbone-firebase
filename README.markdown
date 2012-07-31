### Backbone <-> Firebase 0.0.3

This script does two things:

* Overloads Backbone.sync to use Firebase instead of AJAX.
* Adds a BackboneFirebase object which keeps a collection in sync with Firebase

#### Getting started:

1. Edit backbone-firebase.js to configure the URL to use your app's namespace.
2. Include backbone-firebase.js in your project.
3. By default all models/collections will persist to Firebase based on the URL path of the model/collection.

If you would like your collection to stay in sync w/ Firebase do the following:

    var Post = Backbone.Model.extend({
      idAttribute: '_firebase_name'
    });
    
    var collection = Backbone.Collection.extend({
      model: Post,
      url: "/posts",

      initialize: function() {
        this.backboneFirebase = new BackboneFirebase(this);
      }

    });


Questions? Comments? Let me know!
