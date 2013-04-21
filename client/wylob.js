
Netlighters = new Meteor.Collection("netlighters");
TalentSearchers = new Meteor.Collection("talent_searchers");
Wylobs = new Meteor.Collection("wylobs");
Messages = new Meteor.Collection("messages");
Points = new Meteor.Collection("points");

/**
 * Navbar & Routing
 */
var navbarItems = [{link: "add", text: "Add Wylob", active: "active"},
  {link: "feed", text: "Newsfeed"},
  {link: "highscore", text: "Highscores"}
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
Template.highscore.netlighters = function () {
  return Netlighters.find({}, {sort: {score: -1, name: 1}});
};
Template.highscore.selected_name = function () {
  var netlighter = Netlighters.findOne(Session.get("selected_player"));
  return netlighter && netlighter.name;
};
Template.highscore.wylob_list_current_netlighter = function () {
  return Wylobs.find({netlighter_id: Session.get("selected_player")}, {sort: {name: 1}});
};
Template.highscore.events = {
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
    var wylobToBeAdded = Session.get("wylobToBeAdded");
    var titlesplits = wylobToBeAdded.title.split(' ');
    var name = '{0} {1}'.format(titlesplits[0],titlesplits[1]);

    if(Session.get("selected_player") == null)
    {
        $(".alert").html("<b>Error </b> Not logged in");
        $(".alert").toggleClass('hide');
        return;
    }

    Wylobs.insert({
        name: name,
        step: 1,
        status: "new",
        netlighter_id: Session.get("selected_player"),
        data : wylobToBeAdded
    });

    $(".alert").html("<b>Congratulations </b>Added Wylob: '{0}'".format(name));
    $(".alert").toggleClass('hide');
  },
  'keyup input[name=name]' : function() {
      var form = $("#add_wylob_form"),
          url = form.find("[name=name]").val();
      console.log("url", url);

      if(url.length < 10) // Guard for short urls
        return;

      if(url.indexOf("http://") == -1)
        url = "http://" + url;

      GetEmbedlyJSONObject(url, function(err, res) {
          $(".new_wylob").html(res.html);

          var form = $("#add_wylob_form"),
              url = form.find("[type=submit]").removeClass('hide');
          Session.set("wylobToBeAdded", res);

      });
  }
};


var GetEmbedlyJSONObject = function (url, callback) {
  var spinner = new Spinner().spin();
  $(".new_wylob").html(spinner.el);

  EmbedlyProvider.GetEmbedlyJSONObject(url, function(err, res) {
    if (err) {
      console.error(err);
      $(".new_wylob").html("<div class='alert alert-danger'><b>Error!</b><div>"+err+"</div></div>");
    } else {
      return callback(null, res);
    }
  });
};



/**
 * Messages
 */
Template.messages.selected_name = function () {
  var netlighter = Netlighters.findOne(Session.get("selected_player"));
  if (netlighter) {
    return netlighter.name;
  }
};
Template.messages.selected = function () {
  var netlighter = Netlighters.findOne(Session.get("selected_player"));
  return netlighter && netlighter.name;
};
Template.messages.messages = function () {
  var messages = [],
      all_messages = Messages.find({}, {sort: {timestamp: -1}, limit: 20});
  all_messages.forEach(function (item) {
    if (item.netlighter_id === Session.get("selected_player")) {
      messages.push(item);
    } else if (item.statusClass !== "danger" && item.statusClass !== "warning") {
      messages.push(item);
    }
  });
  return messages;
};

/**
 * Message item
 */
Template.message.private_message = function () {
  return Session.equals('selected_player', this.netlighter_id);
};
Template.message.timestamp = function () {
  var d = new Date(this.timestamp);
  var month = (d.getMonth()+1);
  if (month < 10) {
    month = "0" + month;
  }
  return d.getFullYear() + "-" + month + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
  return dateFormat(d, "dddd, mmmm dS, yyyy, h:MM:ss TT");
};

Template.message.ts_image = function () {
  var wylob_item = Wylobs.findOne(this.wylob_id);
  if (wylob_item && wylob_item.talent_searcher_id) {
    var ts_person = TalentSearchers.findOne(wylob_item.talent_searcher_id);
    if (ts_person && ts_person.thumbnail_url) {
      return ts_person.thumbnail_url;
    }
  }
  return "/img/person_dummy.png";
};
Template.message.netlighter_image = function () {
  var wylob_item = Wylobs.findOne(this.wylob_id);
  if (wylob_item && wylob_item.netlighter_id) {
    var netlighter = Netlighters.findOne(wylob_item.netlighter_id);
    if (netlighter && netlighter.thumbnail_url) {
      return netlighter.thumbnail_url;
    }
  }
  return "/img/person_dummy.png";
};
Template.message.netlighter_name = function () {
  var wylob_item = Wylobs.findOne(this.wylob_id);
  if (wylob_item.netlighter_id) {
    var netlighter = Netlighters.findOne(wylob_item.netlighter_id);
    if (netlighter && netlighter.name) {
      return netlighter.name;
    }
  }
  return "Unknown";
};
