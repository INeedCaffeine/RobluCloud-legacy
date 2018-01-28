var async = require('asyncawait/async');
var await = require('asyncawait/await');
var asyncHandler = require('async-handler')(async, await);
var bcrypt = require('bcrypt-nodejs');  // module used to hash passwords

/*
 * Admin controls for the server operator
 */ 
module.exports = {

  /*
   * Allows the admin to see all the data contained within one team (except for Checkouts/scouting data)
   */
  getTeam: asyncHandler(function (req, res) {
    try { user = await(AdminAuthService.authenticate_async(req)); }
    catch (err) { return RespService.e(res, 'Failed to authenticate as Admin'); };

    // use provided parameters for searching
    var query = { code: req.param('code'), ownerEmail: req.param('ownerEmail'), secret: req.param('secret'), number: req.param('number')};

    try {
      var teams_ref = await(Teams.findOne(query));
      return RespService.s(res, teams_ref);
    } catch (err) { return RespService.e(res, 'Database fail'); }
  }),

  /*
   * Creates a new team on the server
   */
  createTeam: asyncHandler(function (req, res) {
    try { user = await(AdminAuthService.authenticate_async(req)); }
    catch (err) { return RespService.e(res, 'Failed to authenticate as Admin: '+err); };

    // checks for required params
    if (!req.param('official_name')) return RespService.e(res, 'Missing name');
    if (!req.param('ownerEmail')) return RespService.e(res, 'Missing email');
    if (!req.param('secret')) return RespService.e(res, 'Missing secret');

    //creates array "new_user" with all the info provided in the call, as well as generated a five character long team code
    var new_team = { official_team_name: req.param('official_name'), ownerEmail: req.param('ownerEmail'), code: Math.random().toString(36).substring(3, 12), secret: Math.random().toString(36).substring(3, 14)};

    // creates the new user in the database with the new_user object
    try { var teams_object = await(Teams.create(new_team)); }
    catch (err) { return RespService.e(res, err); }

    return RespService.s(res, teams_object);  // respond success with team data
  }),
  /*
   * Deletes a team on the server
   */
  deleteTeam: asyncHandler(function (req, res) {
    try { user = await(AdminAuthService.authenticate_async(req)); }
    catch (err) { return RespService.e(res, 'Failed to authenticate as Admin'); };

    if (!req.param('number')) return RespService.e(res, 'Missing number');

    var team_to_delete = {ownerEmail: req.param('ownerEmail'), official_name: req.param('official_name')};

    try { var ref = await(Teams.destroy(team_to_delete)); }
    catch (err) { return RespService.e(res, err); }

    return RespService.s(res, ref);
  }),
  /*
   * Regenerates a team's code without needing access to their old one
   */
  regenerateCode: asyncHandler(function (req, res) {
    try { user = await(AdminAuthService.authenticate_async(req)); }
    catch (err) { return RespService.e(res, 'Failed to authenticate as Admin'); };

    var query = {official_name: req.param('official_name'), ownerEmail: req.param('ownerEmail') };

    var new_code = Math.random().toString(36).substring(3, 12);

    try { var updated = await(Teams.update(query, { code: new_code })); }
    catch (err) { return RespService.e(res, 'Failed to regenerate team code'); }

    try {
      await(Checkouts.update(query, { code: updated.code }));
    } catch (err) { } // ignore this error, if we return after this error, the team could get locked out of their account

    return RespService.s(res, updated.code);
  }),  
  // TEMPORARY METHOD - DO NOT LEAVE IN PRODUCTION
 /*create_admin_user: asyncHandler( function (req, res) {
    // checks for all required user input
    if (!req.param('name')) return RespService.e(res, 'Missing name');
    if (!req.param('email')) return RespService.e(res, 'Missing email');
    
    // Generate an internal auth token
    var genToken = Math.random().toString(36);
    var new_user = { name: req.param('name'), email: req.param('email'), admin: true,  auth: genToken};

    // creates the new user in the database with the new_user object
    try { var users_object = await(Users.create(new_user)); }
    catch(err) { return RespService.e(res, 'User creation error: ' + err); }
        
    return RespService.s(res, users_object);  // respond success with user data
  }),*/
};
