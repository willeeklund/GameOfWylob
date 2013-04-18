
Netlighters = new Meteor.Collection("netlighters");
Wylobs = new Meteor.Collection("wylobs");
Messages = new Meteor.Collection("messages");
Points = new Meteor.Collection("points");

// Meteor.publish("userData", function () {
//   return Meteor.users.find({fields: {'services': 1}});
// });

// Meteor.publish("allUserData", function () {
//   return Meteor.users.find({}, {fields: {'services.facebook': 1}});
// });

Meteor.methods({
  getAccessToken : function() {
    try {
      return Meteor.user().services.facebook.accessToken;
    } catch(e) {
      return null;
    }
  }
});

/**
 * Server code
 */
// On server startup, create some players if the database is empty.

/**
 * Interview process simulation
 */
// Probability to succeed in each interview step
var success_prob = {
  '1': 0.5,
  '2': 0.5,
  '3': 0.5,
  '4': 0.5
};
var points = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 3,
  '5': 10
};
var startInterview = function (wylob_item) {
  // Mark as active
  wylob_item.status = "active";
  Wylobs.update(wylob_item._id, wylob_item);

  var random = Random.fraction();
  if (random <= success_prob[wylob_item.step]) {
    // Successful interview
    console.log("Successful interview %d for %s (%s <= %s)", wylob_item.step, wylob_item.name, random, success_prob[wylob_item.step]);
    Meteor.setTimeout(function () {
      if (wylob_item.step < 4) {
        // Next interview
        Messages.insert({msg: wylob_item.name + " passed interview " + wylob_item.step, statusClass: "info", wylob_id: wylob_item._id, netlighter_id: wylob_item.netlighter_id, timestamp: new Date(), progress: 25*wylob_item.step});
        wylob_item.step = wylob_item.step + 1;
        Wylobs.update(wylob_item._id, {$inc: {step: 1}});
        startInterview(wylob_item);
      } else {
        // New hire
        Messages.insert({msg: wylob_item.name + " was hired :)", statusClass: "success", wylob_id: wylob_item._id, netlighter_id: wylob_item.netlighter_id, timestamp: new Date(), progress: 25*wylob_item.step});
        console.log("  New hire!");
        Wylobs.update(wylob_item._id, {$set: {status: "success"}});
        Netlighters.update(wylob_item.netlighter_id, {$inc: {score: points[5]}});
        // Points.insert({wylob_id: wylob_item._id, netlighter_id: wylob_item.netlighter_id, points: points[wylob_item.step], step: wylob_item.step, timestamp: new Date()})
      }
    }, Math.floor(Random.fraction()*5000));
  } else {
    // Failed interview
    if (wylob_item.step < 4) {
      console.log("Failed interview %d for %s (%s > %s)", wylob_item.step, wylob_item.name, random, success_prob[wylob_item.step]);
      Messages.insert({msg: wylob_item.name + " did not make it pass interview " + wylob_item.step, statusClass: "danger", wylob_id: wylob_item._id, netlighter_id: wylob_item.netlighter_id, timestamp: new Date(), progress: 25*wylob_item.step});
    } else {
      console.log("Candidate %s took another job (%s > %s)", wylob_item.name, random, success_prob[wylob_item.step]);
      Messages.insert({msg: wylob_item.name + " took another job ", statusClass: "warning", wylob_id: wylob_item._id, netlighter_id: wylob_item.netlighter_id, timestamp: new Date(), progress: 25*wylob_item.step});
    }
    Netlighters.update(wylob_item.netlighter_id, {$inc: {score: points[wylob_item.step]}});
    // Points.insert({wylob_id: wylob_item._id, netlighter_id: wylob_item.netlighter_id, points: points[wylob_item.step], step: wylob_item.step, timestamp: new Date()})
    Wylobs.update(wylob_item._id, {$set: {status: "fail"}});
  }
};

Meteor.startup(function () {
  // Init database if empty
  if (Netlighters.find().count() === 0) {
    var db_init_netlighters = [{name: "Wille", email: "wilhelm.eklund@netlight.com"},
                 {name: "Anders", email: "anders.back@netlight.com"},
                 {name: "Magnus", email: "magnus.wilhelmsson@netlight.com"}];
    for (var i = 0; i < db_init_netlighters.length; i++) {
      var netlighter = db_init_netlighters[i];
      Netlighters.insert({name: netlighter.name, email: netlighter.email, score: 0});
    }
  }

  Meteor.setInterval(function () {
    var new_wylobs = Wylobs.find({status: "new"});
    new_wylobs.forEach(function (wylob_item) {
      console.log("new wylob_item:", wylob_item.name);
      startInterview(wylob_item);
    });
  }, 1000);
});
