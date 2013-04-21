
Netlighters = new Meteor.Collection("netlighters");
Wylobs = new Meteor.Collection("wylobs");
Messages = new Meteor.Collection("messages");
Points = new Meteor.Collection("points");

/**
 * Navbar & Routing
 */
var navbarItems = [{link: "add", text: "Add Wylob", active: "active"},
  {link: "feed", text: "Newsfeed"},
  {link: "highscore", text: "Highscores"},
//  {link: "all_wylobs", text: "All Wylobs"}
];
Template.navbar.tabs = function () {
  return navbarItems;
};
Template.navbar.isSelected = function(){
  return Session.equals('route', this.link) ? 'active' : '';
};
Template.navbar.events = {
  'click a': function (ev) {
    ev.preventDefault();
    Session.set('route', this.link);
  },
  'click .spaceify': function (ev) {
    $("head").append('<link rel="stylesheet" type="text/css" href="geo-bootstrap/css/geo-bootstrap.css">');
  }
}
// Set simple routing
if (location.pathname != "/") {
  var path = location.pathname.substr(1);
  Session.set('route', path);
} else {
  Session.set('route', 'add');
}

/**
 * Main template
 */
Template.wylob.netlighters = function () {
  return Netlighters.find({}, {sort: {score: -1, name: 1}});
};
Template.wylob.selected_name = function () {
  var netlighter = Netlighters.findOne(Session.get("selected_player"));
  return netlighter && netlighter.name;
};
Template.wylob.wylob_list = function () {
  return Wylobs.find({}, {sort: {status: -1, name: 1}});
};
Template.wylob.wylob_list_current_netlighter = function () {
  return Wylobs.find({netlighter_id: Session.get("selected_player")}, {sort: {name: 1}});
};
Template.wylob.page_add = function () {
  return Session.equals('route', 'add');
};
Template.wylob.page_my_page = function () {
  return Session.equals('route', 'my_page');
};
Template.wylob.page_highscore = function () {
  return Session.equals('route', 'highscore');
};
Template.wylob.page_all_wylobs = function () {
  return Session.equals('route', 'all_wylobs');
};
Template.wylob.events = {
  'click #unselect': function () {
    Session.set("selected_player", null);
  },
  'click input.inc': function () {
    Netlighters.update(Session.get("selected_player"), {$inc: {score: 5}});
  },
  'click input.dec': function () {
    Netlighters.update(Session.get("selected_player"), {$inc: {score: -5}});
  },
  'click .toggle_add_netlighter_form': function () {
    $(".add_netlighter_form").toggle();
  },
  'submit #add_netlighter_form': function (ev) {
    ev.preventDefault();
    var form = $("#add_netlighter_form"),
    name = form.find("[name=name]").val();
    new_id = Netlighters.insert({name: name, score: 0});
    Session.set("selected_player", new_id);
  }
};

/**
 * Netlighter
 */
Template.netlighter.selected = function () {
  return Session.equals("selected_player", this._id) ? "selected" : '';
};
// Template.netlighter.score = function () {
//   var sum = 0.0;
//   console.log("Session.get('selected_player')", Session.get("selected_player"))
//   points = Points.find({netlighter_id: this._id});
//   console.info("points", points);
//   points.forEach(function (item) {
//     sum += item.points;
//     console.log("item", item)
//   });
//   return sum;
// };
Template.netlighter.events({
  'click': function () {
    Session.set("selected_player", this._id);
  },
  'click .delete': function () {
    console.log("deleting id:", this._id);
    Netlighters.remove(this._id);
  }
});

/**
 * Wylob person
 */
Template.wylob_person.netlighter = function () {
  var netlighter = Netlighters.findOne(this.netlighter_id);
  console.log("wylob_person.netlighter():", netlighter);
  if (netlighter) {
    return netlighter.name
  } else {
    return "(noname)";
  }
};
Template.wylob_person.events({
  'click .delete': function () {
    console.log("deleting id:", this._id);
    Wylobs.remove(this._id);
  }
});

/**
 * Add Wylob form
 */
Template.add_wylob_form.selected_name = function () {
  var netlighter = Netlighters.findOne(Session.get("selected_player"));
  return netlighter && netlighter.name;
};
Template.add_wylob_form.fb_friends = function () {
  Meteor.call("getAccessToken", function(error, accessToken){
   console.info("getAccessToken", accessToken);

    Meteor.http.get(
      "https://graph.facebook.com/me/friends",
      {params: {access_token: accessToken}},
      function (a,res,c) {
        var data = EJSON.parse(res.content).data;
        console.warn("response from async function?", data);
        data.forEach(function (item) {
          var str = "<li class='item' data-fbid='"+item.id+"'>";
          str += "<img width=80 height=80 src='https://graph.facebook.com/"+item.id+"/picture?access_token="+accessToken+"'>";
          str += item.name;
          str += "</li>";
          $("#fb_friends_list").append(str);
        });
      }
    );
  });
};
Template.add_wylob_form.events = {
  'submit #add_wylob_form': function (ev) {
    ev.preventDefault();
    var form = $("#add_wylob_form"),
    name = form.find("[name=name]").val();
    console.log("New name:", name);
    Wylobs.insert({name: name, step: 1, status: "new", netlighter_id: Session.get("selected_player")});
  }
};

/**
 * Messages
 */
Template.messages.selected_name = function () {
  var netlighter = Netlighters.findOne(Session.get("selected_player"));
  console.log("messages.selected_name():", netlighter);
  if (netlighter) {
    return netlighter.name
  }
};
Template.messages.selected = function () {
  var netlighter = Netlighters.findOne(Session.get("selected_player"));
  return netlighter && netlighter.name;
};
Template.messages.messages = function () {
  return Messages.find({netlighter_id: Session.get("selected_player")}, {sort: {timestamp: -1}, limit: 6});
};

/**
 * Message item
 */
Template.message.timestamp = function () {
  var d = new Date(this.timestamp);
  var month = (d.getMonth()+1);
  if (month < 10) {
    month = "0" + month;
  }
  return d.getFullYear() + "-" + month + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
  return dateFormat(d, "dddd, mmmm dS, yyyy, h:MM:ss TT");
};
