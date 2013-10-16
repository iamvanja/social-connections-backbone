(function() {

    window.App = {
        Models: {},
        Collections: {},
        Views: {},
        Routers: {},
        Helpers: {}
    };

    App.Helpers.template = function(id) {
        return _.template( $('#' + id).html() );
    };

    // Person Model
    App.Models.Person = Backbone.Model.extend({
        defaults: {
            id        : null,
            firstName : 'John',
            surname   : 'Doe',
            age       : 'unknown',
            gender    : 'unknown',
            friends   : null
        }
    });

    // A List of People
    App.Collections.People = Backbone.Collection.extend({
        model: App.Models.Person,

        url: 'js/data.js'
    });


    // View for all people
    App.Views.People = Backbone.View.extend({
        tagName: 'ul',

        render: function() {
            this.collection.each(function(person) {
                var personView = new App.Views.MenuPerson({ model: person });
                this.$el.append( personView.render().el );
            }, this);

            return this;
        }
    });

    // The View for a Person
    App.Views.MenuPerson = Backbone.View.extend({
        tagName: 'li',
        className: 'menuItem',
        template: App.Helpers.template('personMenuTemplate'),

        render: function() {
            this.$el.attr('id', 'item'+this.model.get('id'));
            this.$el.html( this.template(this.model.toJSON()) );
            return this;
        }
    });

    // Detailed Person View
    App.Views.DetailPerson = Backbone.View.extend({
        tagName: 'div',
        template: App.Helpers.template('personDetailTemplate'),

        initialize: function () {
            this.setSocialConnections();
        },

        render: function() {
            this.$el.html( this.template(this.model.toJSON()) );
            return this;
        },

        setSocialConnections : function() {
            var that = this;

            if (this.model.get('friends')) {
                var directFriends = {},
                    friendsOfFriends = {},
                    suggestedFriends = {},
                    suspectedSuggestedFriends = [];

                // first look for direct friends
                this.model.get('friends').map(function(id) {
                    directFriends[id] = that.getPersonInfo(id);
                });
                // set object to person model
                this.model.set('directFriends', directFriends);

                // then, if there are directFriends
                // look for other connections
                if (!_.isEmpty(directFriends)){
                    // loop through direct friends
                    _.each(directFriends, function(directFriend) {
                        // for each direct friend's friends
                        directFriend.friends.map(function(id){
                            // ignore if this person is the current person
                            if (id !== that.model.get('id')) {
                                // if not found, this is friend of a friend
                                if (typeof directFriends[id] === 'undefined') {
                                    friendsOfFriends[id] = that.getPersonInfo(id);
                                }
                                // first time add to suspected suggested friends,
                                // second time add to real suggested friends
                                if (suspectedSuggestedFriends.indexOf(id) > -1) {
                                    suggestedFriends[id] = that.getPersonInfo(id);
                                }
                                else {
                                    suspectedSuggestedFriends.push(id);
                                }
                            }
                        });
                    });
                    // reset suspectedSuggestedFriends array
                    suspectedSuggestedFriends = [];
                }

                // set objects to person model
                this.model.set('friendsOfFriends', friendsOfFriends);
                this.model.set('suggestedFriends', suggestedFriends);
            }
            return;
        },

        getPersonInfo : function(id) {
            var personInfo = this.collection.get(id);
            return {
                id        : id,
                firstName : personInfo.get('firstName'),
                surname   : personInfo.get('surname'),
                friends   : personInfo.get('friends')
            };
        }
    });


    // Router
    App.Routers.Navigation = Backbone.Router.extend({
        routes: {
            'person/:id': 'showPerson',
            '*actions': 'defaultRoute'
        },

        initialize: function (collection) {
            var peopleView = new App.Views.People({
                collection : collection
            });
            $('#theMenu').append( peopleView.render().el );

            return this;
        },

        defaultRoute: function (actions) {
            this.showPerson( peopleCollection.first().get('id') );
        },

        showPerson: function (id) {
            var personInfoView = new App.Views.DetailPerson({
                model      : peopleCollection.get(id),
                collection : peopleCollection
            });
            $('#item' + id).addClass('active')
                           .siblings()
                           .removeClass('active');

            $('#theContent').html( personInfoView.render().el );
        }
    });

    // init
    var peopleCollection = new App.Collections.People();
    peopleCollection.fetch({
        success: function(collection, options){
            var navigationRouter = new App.Routers.Navigation(collection);

            Backbone.history.start({
                pushState: false
            });
            Backbone.history.loadUrl();
        }
    });

})();