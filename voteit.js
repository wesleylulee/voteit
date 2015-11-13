Events = new Mongo.Collection('events');

if (Meteor.isServer) {
  Meteor.publish('events', function () {
    return Events.find();
  });
}

if (Meteor.isClient) {
  Meteor.subscribe('events');

  Template.body.helpers({
    events: function () {
      return Events.find({}, {sort: {createdAt: -1}});
    },
  });

  Template.body.events({
    'submit .new-event': function(event) {
      // Prevent default browser form submit
      event.preventDefault();
      var text = event.target.text.value;
      Meteor.call('addEvent', text);;
      event.target.text.value = '';
    }
  });

  Template.event.events({
    'click .votes-link': function(event) {
      console.log(this);
      $('#votes-' + this._id).toggle();
    },
    'click .new-suggestion': function(event) {
      $('#suggestion-input-' + this._id).toggle();
    },
    'click .vote-up': function(event, template) {
      var eventId = template.data._id;
      var vote = this.name;
      Meteor.call("voteSuggestion", eventId, vote, Meteor.user().username);
    },
    'submit .suggestion-input': function(event) {
      event.preventDefault();
      var text = event.target.text.value;
      Meteor.call("addSuggestion", this._id, text, Meteor.user().username);
      $('#votes-' + this._id).show();
      // Clear form
      event.target.text.value = "";
    },
    'click .delete': function() {
      Meteor.call('deleteEvent', this._id);
    }
  });

  Template.event.helpers({
    arrayify: function (obj, parentObj) {
      result = [];
      for (var key in obj) result.push({name:key, value:obj[key], eventId: parentObj});
      return result;
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

Meteor.methods({
  addEvent: function(name) {
    Events.insert({
      name: name,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username,
      usersVoted: [],
      votes: {}
    });
  },
  addSuggestion: function(eventId, suggestion, username) {
    var event = Events.findOne(eventId);
    var votes = event.votes
    votes[suggestion] = 0
    Events.update(eventId, {$set: {votes: votes} });
  },
  voteSuggestion: function(eventId, suggestion, username) {
    var event = Events.findOne(eventId);
    var votes = event.votes;
    var usersVoted = event.usersVoted;
    if (usersVoted.indexOf(username) === -1) {
      votes[suggestion]++;
      usersVoted.push(username);
      Events.update(eventId, { $set: {votes: votes, usersVoted: usersVoted} });
    };
  },
  deleteEvent: function(eventId) {
    Events.remove(eventId);
  }
});
