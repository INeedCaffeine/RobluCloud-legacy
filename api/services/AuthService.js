var await = require('asyncawait/await');
var bcrypt = require('bcrypt-nodejs');  // module used to hash passwords

module.exports = {

  // When authentication is needed, verify user permission and return default status object
  // required inputs: request object, permission string ("admin" for admin users, or a microservice name such as "players"),
  // returns the user's id (for admin, returns -1)
  authenticate_async: function (req, f_admin_required) {
    if (!req.param('auth')) throw new Error('Missing token');
    
    // lookup token and connected permissions and user info 
    try { var user = await(Users.findOne({auth: req.param('auth')})); } 
    catch(err) { throw new Error('Token lookup problem. Check input data. ' + err); }
    
    if (!user) throw new Error('Token not found in database');

    // check if admin is required
    if (f_admin_required) {
      if (!user.admin) throw new Error('Only admins can use this function');
      return -1;  // if authorized, allow the requesting action to proceed
    }

    return user;  // if authorized, allow the requesting action to proceed
  },
}