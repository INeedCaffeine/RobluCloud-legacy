var await = require('asyncawait/await');
var bcrypt = require('bcrypt-nodejs');

module.exports = {

  /*
   * This authentication method 
   */
  authenticate_async: function (req) {
    if (!req.param('auth')) throw new Error('Missing token');
    
    // lookup token and connected permissions and user info 
    try { var user = await(Admin.findOne({auth: req.param('auth')})); } 
    catch(err) { throw new Error('Token lookup problem. Check input data. ' + err); }
    
    if (!user) throw new Error('Token not found in database');

    return user;  // if authorized, allow the requesting action to proceed
  },
}
