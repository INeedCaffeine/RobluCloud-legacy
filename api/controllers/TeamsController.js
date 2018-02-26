var async = require('asyncawait/async');
var await = require('asyncawait/await');
var asyncHandler = require('async-handler')(async, await);
var bcrypt = require('bcrypt-nodejs')

/*
 * TeamsController manages one database: Teams
 */ 
module.exports = {

 /*
  * getTeam() will return an entire team model to the requestor. Server-identification variables
  * are removed for security purposes. Only meta-data items and content is returned.
  * This is a nice method because it reurns all the variables that the client needs in one fell
  * swoop.
  *
  * Sending the time parameter will tell this method to only return if the local timestamp is greater than the received one.
  * The Scouter should only call this method without a timestamp when it's the first call to check for data.
  *
  */
  getTeam: asyncHandler(function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req, true)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    var query = { code: req.param('code') };
    if (req.param('teamNumber')) query = { official_team_name: req.param('teamNumber') };

    try {
      var teams_ref = await(Teams.findOne(query));
      teams_ref.code = null;
      teams_ref.owner_email = null;
      teams_ref.secret = null;

      if (req.param('time')) {
        if (req.param('time') != -1 && req.param('time') > teams_ref.last_content_edit.getTime()) return RespService.s(res, 'You are up to date (no team data available)!');
      }

      return RespService.s(res, teams_ref);
    } catch (err) { return RespService.e(res, 'Database fail'); };
  }),

  /*
   * This method allows clients to greatly reduce data transfer when an event isn't active.
   * This method will only return one boolean.
   *
   */
  isActive: asyncHandler(function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req, true)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    if (!req.param('code')) return RespService.e(res, 'Missing code');

    var query = { code: req.param('code') };

    try {
      var teams_ref = await(Teams.findOne(query));

      return RespService.s(res, teams_ref.active);
    } catch (err) { return RespService.e(res, 'Database fail'); }
  }),
  
  /**
   * Regenerates the team's token (also effectively kicks all the teammates off the team).
   * This should be used if a team suspects that an unwanted party has gained access to their
   * team code.
   * 
   * Also:
   * -Updates codes in Checkouts
   * 
   */ 
  regenerateCode: asyncHandler(function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req, false)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    if (!req.param('code')) return RespService.e(res, 'Missing code');

    var query = {code: req.param('code')};
  
    var new_code = Math.random().toString(36).substring(3, 12);
  
    try { var updated = await(Teams.update(query, {code: new_code})); }
    catch (err) { return RespService.e(res, 'Failed to regenerate team code'); }

    // Remove secret data
    updated.owner_email = null;
    updated.secret = null;

    try {
        await(Checkouts.update(query, {code: updated.code}));
    } catch (err) {} // ignore this error, if we return after this error, the team could get locked out of their account

    return RespService.s(res, updated);
  }),  
/*
 * Changes the opt-in status for this team
 * 
 */
  pushOptStatus: asyncHandler(function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req, false)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    // check for required params
    if (!req.param('opted')) return RespService.e(res, 'Missing opted state');
    if (!req.param('code')) return RespService.e(res, 'Missing team code');

    // try to update the team's code
    try {
      var query = { code: req.param('code') };
      var teams_ref = await(Teams.update(query, {opted_in: req.param('opted')}));
      return RespService.s(res, 'Opted status updated successfully updated successfully');
    } catch (err) {
      return RespService.e(res, 'Database fail: ' + err);
    }
  }),

  /*
   * Pushes a form's content to the team model
   * 
   */ 
  pushForm: asyncHandler(function(req, res) {
    try { team = await(TeamAuthService.authenticate_async(req, false)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    // check for required params
    if(!req.param('content')) return RespService.e(res, 'Missing form content');
    if(!req.param('code')) return RespService.e(res, 'Missing team code');
    
    // try to update the team's code
    try {
      var query = {code: req.param('code')};
      var teams_ref = await(Teams.update(query, { form: req.param('content'), last_content_edit: new Date()})); 
      return RespService.s(res, 'Form updated successfully');
    } catch(err) {
      return RespService.e(res, 'Database fail: '+err);
    }
  }),

  /*
   * Pushes UI's content to the team model
   * 
   */
  pushUI: asyncHandler(function(req, res) {
    try { team = await(TeamAuthService.authenticate_async(req, false)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    // check for required params
    if(!req.param('content')) return RespService.e(res, 'Missing form content');
    if(!req.param('code')) return RespService.e(res, 'Missing team code');

    // try to update the team
    try {
      var query = { code: req.param('code') };
      var teams_ref = await(Teams.update(query, { ui: req.param('content'), last_content_edit: new Date()})); 
      return RespService.s(res, 'UI updated successfully');
    } catch(err) {
      return RespService.e(res, 'Database fail: '+err);
    }
  }),
}
