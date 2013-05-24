
Netlighters = new Meteor.Collection("netlighters");
TalentSearchers = new Meteor.Collection("talent_searchers");
Wylobs = new Meteor.Collection("wylobs");
Messages = new Meteor.Collection("messages");
Points = new Meteor.Collection("points");

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
  '4': 0.9
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
  Wylobs.update(wylob_item._id, {$set: {status: "active"}});

  var random = Random.fraction();
  if (random <= success_prob[wylob_item.step]) {
    // Successful interview
    console.log("Successful interview %d for %s (%s <= %s)", wylob_item.step, wylob_item.name, random, success_prob[wylob_item.step]);
    Meteor.setTimeout(function () {
      if (wylob_item.step < 4) {
        // Next interview
        Messages.insert({
          msg: wylob_item.name + " passed interview " + wylob_item.step,
          statusClass: "info",
          wylob_id: wylob_item._id,
          netlighter_id: wylob_item.netlighter_id,
          timestamp: new Date(),
          progress: 25*wylob_item.step
        });
        wylob_item.step = wylob_item.step + 1;
        Wylobs.update(wylob_item._id, {$inc: {step: 1}});
        startInterview(wylob_item);
      } else {
        // New hire
        Messages.insert({
          msg: wylob_item.name + " was hired :)",
          statusClass: "success",
          wylob_id: wylob_item._id,
          netlighter_id: wylob_item.netlighter_id,
          timestamp: new Date(),
          progress: 25*wylob_item.step
        });
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
      Messages.insert({
        msg: wylob_item.name + " did not make it pass interview " + wylob_item.step,
        statusClass: "danger",
        wylob_id: wylob_item._id,
        netlighter_id: wylob_item.netlighter_id,
        timestamp: new Date(),
        progress: 25*wylob_item.step
      });
    } else {
      console.log("Candidate %s took another job (%s > %s)", wylob_item.name, random, success_prob[wylob_item.step]);
      Messages.insert({
        msg: wylob_item.name + " took another job ",
        statusClass: "warning",
        wylob_id: wylob_item._id,
        netlighter_id: wylob_item.netlighter_id,
        timestamp: new Date(),
        progress: 25*wylob_item.step
      });
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
  if (TalentSearchers.find().count() === 0) {
    var db_init_talent_searchers = [
      {name: "Hakim Rudels", thumbnail_url: "http://m3.licdn.com/mpr/pub/image-oX1oqqNhPFc3o06gj_EuwWCzRo0FivG853ERSgmTRVZlx2umoX1RYT9hR58GjrtRSWL5/hakim-rudels.jpg"},
      {name: "Johanna Renberg", thumbnail_url: "http://m3.licdn.com/mpr/pub/image-I_OuZy8n2nPbHzlczX5o5oU7hXt-9FiSI_u1eeCnhuD7L9dGI_O1eVjnhOJAyjPmqrG9/johanna-renberg.jpg"},
      {name: "Per Nyström Ol-Ers", thumbnail_url: "http://m3.licdn.com/mpr/pub/image-bsIWQiaAcs_Rz5aj2GhDh9Dm7Mqy-s6HUADFmSAQ79-LAaq5bsIFgMBA7ieeADk_o8MZ/per-nystr%C3%B6m-ol-ers.jpg"},
      {name: "Andy Persson", thumbnail_url: "http://m.c.lnkd.licdn.com/media/p/4/000/170/1b8/05b5ee6.jpg"},
      {name: "Carolina Edgren", thumbnail_url: "http://m3.licdn.com/mpr/pub/image-1IA-bP5sDz2QwJe85DTtSfV2lJxUaJgG1ITnw3JSl6wgasOq1IAnFTqslyQbD6lLb6Ku/carolina-edgren.jpg"}
    ];
    for (var i = 0; i < db_init_talent_searchers.length; i++) {
      var talent_searcher = db_init_talent_searchers[i];
      TalentSearchers.insert({name: talent_searcher.name, thumbnail_url: talent_searcher.thumbnail_url});
    }
  }

  Meteor.setInterval(function () {
    var new_wylobs = Wylobs.find({status: "new"});
    new_wylobs.forEach(function (wylob_item) {
      // Assign a TalentSeearcher to this WYLOB
      var tsgroup = TalentSearchers.find({}),
          random = Math.floor(Random.fraction()*tsgroup.count()),
          i=0;
      tsgroup.forEach(function (ts_person) {
        if (i === random) {
          wylob_item.talent_searcher_id = ts_person._id;
          Wylobs.update(wylob_item._id, {$set: {talent_searcher_id: ts_person._id}});
          //Wylobs.update(wylob_item._id, {$set: {status: "success"}});
          Messages.insert({
            msg: ts_person.name + " (from Talent Search) was assigned to handle the interview process for " + wylob_item.name,
            statusClass: "info",
            wylob_id: wylob_item._id,
            netlighter_id: wylob_item.netlighter_id,
            timestamp: new Date(),
            progress: 0
          });
        }
        i++;
      });
      console.log("new wylob item", Wylobs.findOne(wylob_item._id));
      startInterview(wylob_item);
    });
  }, 1000);
});
