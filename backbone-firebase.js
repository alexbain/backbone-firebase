//     Backbone <-> Firebase v0.0.3
//
//     Started as a fork of Backpusher.js (https://github.com/pusher/backpusher)
//
//     Backbone <-> Firebase (c) 2012 Alex Bain
//     Backpusher originally (c) 2011-2012 Pusher
//
//     This script may be freely distributed under the MIT license.
//
(function(exports, undefined){

  // Note: Add your appname to the end of this string
  var urlPrefix = 'http://gamma.firebase.com/';
  
  var defaults = {
    urlPrefix: urlPrefix,
    idAttribute: '_firebase_name'
  };
  
  var BackboneFirebase = function(collection, options) {

    this.reference = new Firebase(urlPrefix + collection.url);
    this.collection = collection;
    
    // Extend the defaults with the options provided and set as `this.options`.
    this.options = defaults;
    if (options) {
      for (var k in options) {
        this.options[k] = options[k];
      }
    }
    // Optionally pass the urlPrefix in.
    this.reference = new Firebase(this.options.urlPrefix + collection.url);
    // Optionally specify the idAttribute to use.
    this.idAttribute = this.options.idAttribute;
    
    if (this.options.events) {
      this.events = this.options.events;
    } else {
      this.events = BackboneFirebase.defaultEvents;
    }

    this._bindEvents();
    this.initialize(collection, options);

    return this;
  };

  _.extend(BackboneFirebase.prototype, Backbone.Events, {
    initialize: function() {},

    _bindEvents: function() {
      if (!this.events) return;

      for (var event in this.events) {
        if (this.events.hasOwnProperty(event)) {
          this.reference.on(event, _.bind(this.events[event], this));
        }
      }
    },

    _add: function(pushed_model) {
      var Collection = this.collection;

      // Set the model id attribute to be the firebase reference name.
      var attr = pushed_model.val();
      attr[this.idAttribute] = pushed_model.name();
      model = new Collection.model(attr);

      Collection.add(model);
      this.trigger('remote_create', model);

      return model;
    }
  });

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

        return model;
      }
    }
  };

  // Original Backbone.sync method from v0.9.2
  Backbone.sync = function(method, model, options) {

    // Verify Firebase object exists
    if (typeof Firebase === undefined) return false;

    // Default options, unless specified.
    options || (options = {});

    var url = getValue(model, 'url') || urlError();

    // Setup the Firebase Reference
    var ref = new Firebase(urlPrefix + url);

    // Map CRUD to Firebase actions
    switch (method) {
      case 'create':
        ref.push(model.toJSON(), function (success) {
          if (success && options.success) options.success();
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
          else if (!success && options.erorr) options.error();
        });
        break;
      default:
        break;
    }

    return ref;
  };

  var getValue = function(object, prop) {
    if (!(object && object[prop])) return null;
    return _.isFunction(object[prop]) ? object[prop]() : object[prop];
  };

  exports.BackboneFirebase = BackboneFirebase;

})((typeof exports !== 'undefined' ? exports : this));
