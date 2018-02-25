var await = require('asyncawait/await');
var bcrypt = require('bcrypt-nodejs');

module.exports = {
  /*
   * This is the authentication check that most requests have to pass
   * in order to get through. Note, someone could obtain a code relatively easily
   * with wireshark if they are on the same network, since Roblu doesn't contain
   * any valuable data (the only item it stores is one email address per team),
   * it doesn't really matter if someone breaks into the server,
   * because a full reset can be done and no one's data will be lost. If you'd like
   * to help secure the server, that'd be awesome! If you're breaking into it, congrats,
   * this method is really only designed to ward off people who don't care enough.
   */
  authenticate_async: function (req, readOnlyAllowed) {
    if (readOnlyAllowed && req.param('teamNumber') != null) {
      // Only allow teams through that have opted in
      if (!req.param('teamNumber')) throw new Error('Missing team number for read only authentication.');

      try {
        var team = await(Teams.findOne({ official_team_name: req.param('teamNumber') }));
        if (!team.opted_in) throw new Error('Team has not opted in to public scouting data.');
      }
      catch (err) { throw new Error('Token lookup problem. Check input data. ' + err); }

      if (!team) throw new Error('Team not found in database');

      return team;
    }

    if(!req.param('code')) throw new Error('Missing team code parameter');

    try { var team = await(Teams.findOne({ code: req.param('code') })); }
    catch (err) { throw new Error('Token lookup problem. Check input data. ' + err); }

    if (!team) throw new Error('Team not found in database');
   
    return team;
  },
}
