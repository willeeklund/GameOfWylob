/**
 * Created with JetBrains WebStorm.
 * User: andersback
 * Date: 9/30/12
 * Time: 12:47 PM
 * To change this template use File | Settings | File Templates.
 */
var embedly_url_template = 'http://api.embed.ly/1/oembed?key=:4bd102ede7754dd5999219fcc4a7c762&url={0}';
EmbedlyProvider = {};

EmbedlyProvider.GetEmbedlyJSONObject = function(url, callback) {
    var url = embedly_url_template.format(url);

    Meteor.http.call("GET", url, function(err, res) {
        if (err) {
            console.error(err);
            callback(err, null);
        } else {
            callback(null, res.data);
        }
    });
}

String.format = String.prototype.format = function() {
    var i=0;
    var string = (typeof(this) == 'function' && !(i++)) ? arguments[0] : this;

    for (; i < arguments.length; i++)
        string = string.replace(/\{\d+?\}/, arguments[i]);

    return string;
};
