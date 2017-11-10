var async = require('asyncawait/async');
var await = require('asyncawait/await');
var asyncHandler = require('async-handler')(async, await);
var bcrypt = require('bcrypt-nodejs');  // module used to hash passwords

/**
 * TeamsController manages one database: Teams
 * 
 * Methods at a glance:
 * -createTeam() - ADMIN only
 * -deleteTeam() - ADMIN only
 * -getTeam() - ADMIN only
 * -regenerateToken()
 * -pushForm()
 * -pullForm()
 * 
 */ 
module.exports = {
  
  /**
   * For roll: ADMIN 
   * 
   * Creates a new FRC team that can pull data. We also generate a code for the user.
   * 
   * Required params:
   * -int number: the unique FRC number of the team
   * -string email: an email address used mostly for support purposes
   * 
   * Possible returns:
   * -string: (error message): team already existed
   * -object team_object: sucessful creation of team
   * -Missing a parameter
   * -Unauthenticated
   *
   *  dev: tested & fully functional
   */
  createTeam: asyncHandler( function (req, res) {
    try { user = await(AuthService.authenticate_async(req, true)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    // checks for required params
    if (!req.param('number')) return RespService.e(res, 'Missing number');
    if (!req.param('email')) return RespService.e(res, 'Missing email');
    if(!req.param('secret')) return RespService.e(res, 'Missing secret');
    
    //creates array "new_user" with all the info provided in the call, as well as generated a five character long team code
    var new_team = { number: req.param('number'), master: req.param('email'), code: Math.random().toString(36).substring(3, 12), secret: req.param('secret') };

    // creates the new user in the database with the new_user object
    try { var teams_object = await(Teams.create(new_team)); }
    catch(err) { return RespService.e(res, err); }
        
    return RespService.s(res, teams_object);  // respond success with team data
  }),
  
  /**
   * For roll: ADMIN
   * 
   * Deletes the team when they stop paying for Roblu Cloud.
   * 
   * Required params:
   * -int number: the team's unique frc number
   * 
   * Possible returns:
   * -string 'Team could not be deleted in database: (error message)': something went wrong
   * -string 'success': team was successfully deleted
   * -Missing a parameter
   * -Unauthenticated
   * 
   * dev: tested & fully functional
   */ 
  deleteTeam: asyncHandler( function (req, res) {
    try { user = await(AuthService.authenticate_async(req, true)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    if(!req.param('number')) return RespService.e(res, 'Missing number');
    
    var team_to_delete = { number: req.param('number') };
    
    try { var ref = await(Teams.destroy(team_to_delete)); }
    catch(err) { return RespService.e(res, err); }
      
    return RespService.s(res, ref);
  }),
  
  /**
   * For roll: MASTER
   * 
   * Regenerates the team's token (also effectively kicks all the team mates off the team).
   * 
   * Also:
   * -Updates codes in Checkouts
   * -Updates codes in InCheckouts
   * 
   * Required parameters:
   * -code: the team's old code
   * -int number: the team's unique FRC number
   * -device: unique device identifier
   * 
   * Possible returns:
   * -string code: the new team code
   * -string 'Database fail: (error message)': something went wrong
   * -Missing a parameter
   * -Unauthenticated
   * 
   * dev: tested & fully functional
   */ 
  regenerateToken: asyncHandler(function (req, res) {
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    if(!req.param('code')) return RespSevice.e(res, 'Missing old token');
    if(!req.param('device')) return RespService.e(res, 'Missing device ID');

    var query = {code: req.param('code'), signed_in_device: req.param('device')};
  
    var new_code = Math.random().toString(36).substring(3, 12);
  
    try { var updated = await(Teams.update(query, {code: new_code})); }
    catch(err) { return RespService.e(res, err); }
    try {
        await(Checkouts.update(query, {code: updated.code}));
        await(InCheckouts.update(query, {code: updated.code}));
    } catch(err) {}
    return RespService.s(res, updated);
  }),
/**
   * For roll: ADMIN
   * 
   * Gets the team for debugging purposes
   * 
   * Required params:
   * code: the team's unique frc code
   * 
   * Possible returns:
   * -string 'Database fail: (error message)': something went wrong
   * -object teams_ref: the team model assosicated with the specified number
   * -Missing a parameter
   * -Unauthenticated
   * 
   */ 
  forceSignOut: asyncHandler(function(req, res) {
    try { user = await(AuthService.authenticate_async(req, true)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    if(!req.param('number')) return RespService.e(res, 'Missing number');
  
    var query = {number: req.param('number')};
  
    try { var teams_ref = await(Teams.update(req.param('number'), {signed_in: false}));
    return RespService.s(res, teams_ref);
    } catch(err) { return RespService.e(res, 'Database fail '+err); }
  }),
  
  
  /**
   * For roll: ADMIN
   * 
   * Gets the team for debugging purposes
   * 
   * Required params:
   * code: the team's unique frc code
   * 
   * Possible returns:
   * -string 'Database fail: (error message)': something went wrong
   * -object teams_ref: the team model assosicated with the specified number
   * -Missing a parameter
   * -Unauthenticated
   * 
   */ 
  getTeamAsAdmin: asyncHandler(function(req, res) {
    try { user = await(AuthService.authenticate_async(req, true)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    if(!req.param('number')) return RespService.e(res, 'Missing number');
  
    var query = {number: req.param('number')};
  
    try { var teams_ref = await(Teams.findOne(query));
    return RespService.s(res, teams_ref);
    } catch(err) { return RespService.e(res, 'Database fail'); }
  }),
  
  
  /**
   * For roll: MASTER
   * 
   * Gets the team for debugging purposes
   * 
   * Required params:
   * code: the team's unique frc code
   * 
   * Possible returns:
   * -string 'Database fail: (error message)': something went wrong
   * -object teams_ref: the team model assosicated with the specified number
   * -Missing a parameter
   * -Unauthenticated
   * 
   */ 
  getTeam: asyncHandler(function(req, res) {
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    if(!req.param('code')) return RespService.e(res, 'Missing code');
  
    var query = {code: req.param('code')};
  
    try { var teams_ref = await(Teams.findOne(query));
    return RespService.s(res, teams_ref);
    } catch(err) { return RespService.e(res, 'Database fail'); }
  }),
  
  /**
   * For roll: MASTER
   * 
   * Pushes a form update when one is made.
   * 
   * Required params:
   * -string content: the JSON serialization of the form object
   * -code: the team code
   * -device: unique device identifier
   * 
   * Possible returns:
   * -string 'Database fail: (error message)': something went wrong
   * -string 'success': team was successfully updated
   * -Missing a parameter
   * -Unauthenticated
   * 
   * dev: tested & fully functional
   */ 
  pushForm: asyncHandler(function(req, res) {
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    // check for required params
    if(!req.param('content')) return RespService.e(res, 'Missing form content');
    if(!req.param('code')) return RespService.e(res, 'Missing team code');
    if(!req.param('device')) return RespService.e(res, 'Missing device ID');
    
    
    // try to update the team
    try {
      var query = {code: req.param('code'), signed_in_device: req.param('device')};
      var teams_ref = await(Teams.update(query, {form: req.param('content'), last_edit: new Date().getTime() / 1000})); 
      return RespService.s(res, teams_ref);
    } catch(err) {
      return RespService.e(res, 'Database fail: '+err);
    }
  }),
  /**
   * For roll: MASTER
   * 
   * Pushes a UI update whenever changes are made to it
   * 
   * Required params:
   * -string content: the JSON serialization of the UI object
   * -code: the team code
   * -device: unique device identifier
   * 
   * Possible returns:
   * -string 'Database fail: (error message)': something went wrong
   * -string 'success': team was successfully updated
   * -Missing a parameter
   * -Unauthenticated
   * 
   * dev: tested & fully functional
   */ 
  pushUI: asyncHandler(function(req, res) {
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    // check for required params
    if(!req.param('content')) return RespService.e(res, 'Missing form content');
    if(!req.param('code')) return RespService.e(res, 'Missing team code');
    if(!req.param('device')) return RespService.e(res, 'Missing device ID');
    
    // try to update the team
    try {
      var query = {code: req.param('code'), signed_in_device: req.param('device')};
      var d = new Date();
      var n = d.getTime();
      var teams_ref = await(Teams.update(query, {ui: req.param('content'), last_ui_edit: new Date().getTime() / 1000})); 
      return RespService.s(res, teams_ref);
    } catch(err) {
      return RespService.e(res, 'Database fail: '+err);
    }
  }),
  /**
   * For roll: MASTER
   * 
   * Prevents the master from signing in from more places at once.
   * 
   * Required params:
   * -code: the team code to attempt to join the team to
   * -device: device: unique device identifier
   * 
   * Possible returns:
   * -string err: something went wrong
   * -updated reference: team model was found and signed_in parameter was updated
   * -Missing a parameter
   * -Unauthenticated
   * 
   */ 
  joinTeam: asyncHandler(function(req, res) {
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    // check for required params
    if(!req.param('code')) return RespService.e(res, 'Missing team code');
    if(!req.param('device')) return RespService.e(res, 'Missing device ID');
    
    // try to find a team with the specified code
    var query = {code: req.param('code')};
    try {
      var temp = await(Teams.findOne(query));
      if(temp == null) return RespService.e(res, 'no team found')
      var updated = await(Teams.update(query, {signed_in_device: req.param('device')}));
      return RespService.s(res, updated);
    } catch(err) {
      return RespService.e(res, 'team doesnt exist');
    }
  }),
  /**
   * For roll: SCOUTER
   * 
   * Helps reduce data transfers by checking if an active event is even present
   * 
   * Required params:
   * -code: the team code to attempt to leave
   * 
   * Possible returns:
   * -string err: something went wrong
   * -updated reference: team model was found and signed_in parameter was updated
   * -Missing a parameter
   * -Unauthenticated
   * 
   */ 
  isActive: asyncHandler(function(req, res) {
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    // try to find a team with the specified code
    var query = {code: req.param('code')};
    try {
      var teams_ref = await(Teams.findOne(query));
      return RespService.s(res, teams_ref.active_event);
    } catch(err) {
      return RespService.e(res, 'team doesnt exist');
    }
  }),
  
  /**
   * For roll: SCOUTER
   * 
   * Pulls the form. Should be called when /checkouts/pullCheckouts is called
   * 
   * Required params:
   * -code: the team code
   * -last_sync: the last time the scouter successfully pulled the form (the last time the form was updated by the master app)
   * 
   * Possible returns:
   * -string 'Database fail: (error message)': something went wrong
   * -object form: the string JSON representation of the form object
   * -Missing a parameter
   * -Unauthenticated
   */ 
  pullForm: asyncHandler(function(req, res) {
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    // check for required params
    if(!req.param('code')) return RespService.e(res, 'Missing team code');
    if(!req.param('last_sync')) return RespService.e(res, 'Missing last sync');
    
    // try to get the form String
    try {
      var query = {code: req.param('code')};
      var teams_ref = await(Teams.findOne(query));
      // only return if the current last sync time is greater than the parameter sync time
      if(teams_ref.last_edit > req.param('last_sync')) return RespService.s(res, teams_ref.form);
      else return RespService.e(res, '');
    } catch(err) { return RespService.e(res, 'Database fail: '+err)}
    
  }),
    /**
   * For roll: SCOUTER
   * 
   * Pulls the UI from the server
   * 
   * Required params:
   * -string content: the JSON serialization of the UI object
   * -code: the team code
   * 
   * Possible returns:
   * -string 'Database fail: (error message)': something went wrong
   * -string 'success': team was successfully updated
   * -Missing a parameter
   * -Unauthenticated
   * 
   * dev: tested & fully functional
   */ 
  pullUI: asyncHandler(function(req, res) {
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    // check for required params
    if(!req.param('code')) return RespService.e(res, 'Missing team code');
    if(!req.param('last_sync')) return RespService.e(res, 'Missing last sync');
    
    // try to get the form String
    try {
      var query = {code: req.param('code')};
      var teams_ref = await(Teams.findOne(query));
      // only return if the current last sync time is greater than the parameter sync time
      if(teams_ref.last_ui_edit > req.param('last_sync')) return RespService.s(res, teams_ref.ui);
     else return RespService.e(res, '');
    } catch(err) { return RespService.e(res, 'Database fail: '+err)}
  })
  
}
