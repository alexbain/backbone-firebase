//     Backbone <-> Firebase v0.0.3
//
//     Started as a fork of Backpusher.js (https://github.com/pusher/backpusher)
//
//     Backbone <-> Firebase (c) 2012 Alex Bain
//     Backpusher originally (c) 2011-2012 Pusher
//
//     @contributor  Kato (katowulf@gmail.com)
//
//     This script may be freely distributed under the MIT license.
//
(function(exports, undefined){
   "use strict";

   var BackboneFirebase = function(collection, options) {
      this.collection = collection;
      this.subscriptions = []; // used by dispose()

      // Extend the defaults with the options provided and set as `this.options`.
      this.options = Backbone.$.extend({
         urlPrefix: BackboneFirebase.DEFAULT_INSTANCE, // use default unless options provides a prefix
         idAttribute: '_firebase_name',
         events: BackboneFirebase.defaultEvents
      }, options);

      if( !collection.url ) {
         return urlError('collection');
      }

      // Optionally pass the urlPrefix in.
      this.reference = getFirebaseRef(this.options.urlPrefix, collection.url);

      // Optionally specify the idAttribute to use.
      this.idAttribute = this.options.idAttribute;

      this._bindEvents();
      this.initialize(collection, options);

      return this;
   };

   _.extend(BackboneFirebase.prototype, Backbone.Events, {
      initialize: function() {},

      _bindEvents: function() {
         var events = this.options.events;
         if (!events) return;

         _.each(events, function(f, event) {
            var fn = disposableEvent(this, event, f);
            this.reference.on(event, fn);
         }, this);
      },

      _add: function(pushed_model) {
         var Collection = this.collection;

         // Set the model id attribute to be the firebase reference name.
         var attr = pushed_model.val();
         attr[this.idAttribute] = pushed_model.name();
         var model = new Collection.model(attr);

         Collection.add(model);
         this.trigger('remote_create', model);

         return model;
      },

      /**
       * Free all resources and stop listening to all events
       */
      dispose: function() {
         _.each(this.subscriptions, function(sub) { sub.dispose(); });
         this.subscriptions = [];
         this.collection = null;
         this.options = null;
      }
   });

   // Allows the default URL to be set globally (can still be overridden in options, too)
   BackboneFirebase.DEFAULT_INSTANCE = 'http://YOURDB.firebaseio.com';

   BackboneFirebase.defaultEvents = {
      child_added: function(pushed_model) {
         return this._add(pushed_model);
      },

      child_changed: function(pushed_model) {

         // Get existing model using the reference name as the model id.
         var model = this.collection.get(pushed_model.name());

         if (model) {
            model = model.set(pushed_model.val());

            this.trigger('remote_update', model);

            return model;
         } else {
            return this._add(pushed_model);
         }
      },

      child_removed: function(pushed_model) {

         // Get existing model using the reference name as the model id.
         var model = this.collection.get(pushed_model.name());

         if (model) {
            this.collection.remove(model);
            this.trigger('remote_destroy', model);
         }
         return model;
      }
   };

   // store the rest API for future use (some models can be bound to this instead of Firebase)
   Backbone.sync_AJAX = Backbone.sync;

   // Original Backbone.sync method from v0.9.2
   Backbone.sync = function(method, model, options) {

      // Verify Firebase object exists
      if (typeof Firebase === undefined) return false;

      // Default options, unless specified.
      options = _.extend({
         urlPrefix: BackboneFirebase.DEFAULT_INSTANCE
      }, options);

      var path = getPath(model, method, model.id);
      if( !path ) {
         return urlError('model');
      }

      // Setup the Firebase Reference
      var ref = getFirebaseRef(options.urlPrefix, path, method);

      // Map CRUD to Firebase actions
      switch (method) {
         case 'create':
            var pushRef = ref.push(model.toJSON(), function (success) {
               if (success && options.success) options.success(pushRef.name());
               else if (!success && options.error) options.error();
            });
            break;
         case 'read':
            ref.once('value', function (data) {
               data = _.toArray(data.val());
               if (options.success) options.success(data, "success", {});
            });
            break;
         case 'update':
            ref.set(model.toJSON(), function (success) {
               if (success && options.success) options.success();
               else if (!success && options.error) options.error();
            });
            break;
         case 'delete':
            ref.remove(function (success) {
               if (success && options.success) options.success();
               else if (!success && options.error) options.error();
            });
            break;
         default:
            break;
      }

      return ref;
   };

   function urlError(source) {
      typeof(console) !== 'undefined' && console.error && console.error(new Error(source+'.url must be defined'));
   }

   function getFirebaseRef(prefix, url) {
      if( !(prefix in INSTANCES) ) {
         // prevent opening multiple instances of Firebase when using the same prefix
         // one instance to rule them all, once instance to find them, one instance to bring them all, and in Backbone.bind() them
         INSTANCES[prefix] = new Firebase(prefix);
      }
      return INSTANCES[prefix].child(url);
   }
   var INSTANCES = {};

   var getPath = function(object, method, id) {
      var u;
      if ( object ) {
         if( _.isFunction(object['url']) ) {
            u = object['url']();
         }
         else {
            u = stripSlashes(object['url']);
            switch(method) {
               case 'update':
               case 'read':
               case 'delete':
                  if( id ){
                     u = u + '/' + id;
                  }
                  else {
                     u = null;
                  }
                  break;
               case 'create':
                  break; // leave it alone
               default:
                  // do nothing
            }
         }
      }
      return u;
   };

   function stripSlashes(u) {
      var last = u.length-1;
      if(u.indexOf('/') === 0) { u = u.substr(1); }
      if(u.indexOf('/') === last) { u = u.substr(0, last); }
      return u;
   }

   // only intended to be used for Firebase on/off functions
   function disposableEvent(self, event, fn) {
      var boundFn = _.bind(fn, self);
      self.subscriptions.push({ dispose: function() {self.reference.off(event, boundFn)} });
      return boundFn;
   }

   exports.BackboneFirebase = BackboneFirebase;

})((typeof exports !== 'undefined' ? exports : this));
