var async = require('asyncawait/async');
var await = require('asyncawait/await');
var asyncHandler = require('async-handler')(async, await);
var bcrypt = require('bcrypt-nodejs');  // module used to hash passwords

/**
 * UsersController manages the Users database
 * 
 * Methods at a glance:
 * -deleteUser() - ADMIN ONLY
 * -signIn();
 * -signOut()
 */ 
module.exports = {
  
  // TEMPORARY METHOD - DO NOT LEAVE IN PRODUCTIoN
 create_admin_user: asyncHandler( function (req, res) {
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
  }),
  
  
  /**
   * For roll: ADMIN
   * 
   * Removes the user from the database for whatever reason.
   * 
   * Required parameters:
   * -string email: the user's unique email address
   * 
   * Possible returns:
   * -string 'success': successfully deleted the user
   * -string 'Database fail: (error message)': something went wrong
   * -Missing a parameter
   * -Unauthenticated
   */ 
  deleteUser: asyncHandler( function (req, res) {
    try { user = await(AuthService.authenticate_async(req, true)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    if(!req.param('email')) return RespService.e(res, 'Missing number');
    
    var user_to_delete = { email: req.param('email') };
    
    try { await(Users.destroy(user_to_delete.id)); }
    catch(err) { return RespService.e(res, 'Database fail: '+err); }
    
    return RespService.s(res, 'success');
  }),


  /**
   * For roll: MASTER & SCOUTER
   * 
   * Attempts to sign the user into their account. Will fail if they are already signed in somewhere else.
   * 
   * Potential issue discussion: So let's say a bad man wants to break our server, he could call this method with somebody
   * else's email and obtain an auth token. Fortunately, he has to know the user's display name & email, and can only
   * sign in if the user isn't already signed in. Might want to verify this though.
   * 
   * Required params:
   * -string name: the user's display name
   * -string email: the user's email
   * 
   * Possible returns:
   * -string 'Fail: in use': the user is already signed in somewhere else
   * -object user: contains the user's information, including the auth token
   * -Missing a token
   * 
   */ 
  signIn: asyncHandler(function(req, res) {
    if(!req.param('name')) return RespService.e(res, 'Missing name');
    if(!req.param('email')) return RespService.e(res, 'Missing email');
    if(!req.param('code')) return RespService.e(res, 'Missing team code');

    // check if the team exists
    var tempq = {code: req.param('code')};
    try { var temp = await(Teams.findOne(tempq));
    if(temp == null) return RespService.e(res, 'team does not exist'); }
    catch(err) { return RespService.e(res, 'team does not exist'); }

    // See if the user already exists
    try { 
      var query = {email: req.param('email'), name: req.param('name')};
      var user_ref = await(Users.findOne(query));
      console.log(user_ref.auth);
    }
    catch(err) {// user didn't exist, create new user
      var users_ref2 = {name: req.param('name'), email: req.param('email'), admin: false, auth: Math.random().toString(36)};
      var created = await(Users.create(users_ref2));
      return RespService.s(res, users_ref2);
    }
    return RespService.s(res, user_ref);
  })
  
};
