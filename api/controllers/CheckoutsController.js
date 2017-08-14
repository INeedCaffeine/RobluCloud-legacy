var async = require('asyncawait/async');
var await = require('asyncawait/await');
var asyncHandler = require('async-handler')(async, await);
var bcrypt = require('bcrypt-nodejs');

/**
 * CheckoutsController manages two databases: Checkouts & InCheckouts
 * 
 * Checkouts manages the full copy of all available checkouts models that scouters can pull.
 * This database contains the checkouts for every single team, meaning that this database will be heavily modified.
 * 
 * Checkouts database is initially populated when the master calls init_sync, calling init_sync will also clear the old data (because the master is essentially uploading a new event then)
 * 
 * The only other changes that can happen to the database:
 * -Scouter checks out a checkout model, must change status from 'Available' to 'Checked out'
 * -Scouter checks out an overriden model, must change status from 'Check out' to 'Overriden'
 * -Master either automatically or explicity confirms a received checkout, which is then merged back into the database
 * 
 * Ways that things can be pulled:
 * -Scouter uses "smart pull". Factors: 1) Pass in array of last sync ids, will only return checkouts that the scouter hasn't seen yet 2) If we have a checkout that is currently checked out locally and we get it back in a return, then it will be deleted locally
 *
 * InCheckouts manages the fully copy of all received checkout models that scouters have checked as "completed".
 * This database contains the checkouts for every single team, meaning that this database will be heavily modified.
 * 
 * InCheckouts database is populated when a scouter fills in data for their checkout model and confirms it for uploading.
 * 
 * The only other events that can happen:
 * -Master pulls received checkouts, then they're deleted from the database
 * 
 * 
 */
module.exports = {
  /**
   * For roll: MASTER
   * 
   * This will clear out any old data from both InCheckouts & Checkouts and push the new list of checkouts.
   * 
   * Required params:
   * -content: the serialized RCheckout model in string form
   * -code: the team code to mark these checkouts a part of
   * -active: the title of the active event
   * -device: unique device identifier
   * 
   * Possible returns:
   * -string 'success': everything was pushed succesfully
   * -string 'initPushCheckouts() failed with error: (error message)': something went wrong
   * -Missing a parameter
   * -Unauthenticated
   * 
   */
  initPushCheckouts: asyncHandler( function (req, res) {
  // Authenticate the user
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error" + err); }

    // Check for required params
    if(!req.param('content')) return RespService.e(res, 'Missing content');
    if(!req.param('code')) return RespService.e(res, 'Missing code');
    if(!req.param('active')) return RespService.e(res, 'Missing title of active event');
    if(!req.param('device')) return RespService.e(res, 'Missing device ID');
    
    try {
      var query1 = {code: req.param('code')};
      var team = await(Teams.findOne(query1));
      if(!(team.signed_in_device === req.param('device'))) return RespService.e(res, 'device unkwown');
    } catch(err) { return RespService.e(res, 'device unkownnw'+err); }
    
    
    // Update team model
    var query2 = {code: req.param('code'), signed_in_device: req.param('device')};
    try {var teams_ref = await(Teams.update(query2, {active_event: req.param('active')})); }
    catch(err) {}
    
    // Remove all the old data if it's there
    var query = {code: req.param('code')};
    try { await(Checkouts.destroy(query)); await(InCheckouts.destroy(query)); }
    catch(err) {}
    
    // Loop through the JSON array of received checkouts
    var classmem = JSON.parse(req.param('content'), 'utf8');
    var item;
    for(item in classmem) {
      var cid = classmem[item].id;
      var ccontent = classmem[item];
      var new_checkout = { id: cid, content: ccontent, last_edit: new Date().getTime() / 1000, status: 'Available', code: req.param('code')};
      try { await(Checkouts.create(new_checkout)); } // Add the checkouts to the Checkouts model
      catch(err) {}
    }

    return RespService.s(res, teams_ref);
  }),
  
  /**
   * For roll: MASTER
   * 
   * This will clear out any old data from both InCheckouts & Checkouts
   * 
   * Required params:
   * -code: the team code to mark these checkouts a part of
   * -device: unique device identifier
   * 
   * Possible returns:
   * -string 'success': everything was pushed succesfully
   * -string 'initPushCheckouts() failed with error: (error message)': something went wrong
   * -Missing a parameter
   * -Unauthenticated
   * 
   */
  clearActiveEvent: asyncHandler(function (req, res) {
    // Authenticate the user
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };

    // Check for required params
    if(!req.param('code')) return RespService.e(res, 'Missing code');
    if(!req.param('device')) return RespService.e(res, 'Missing device ID');
    
    try {
      var query1 = {code: req.param('code'), signed_in_device: req.param('device')};
      var teams_ref = await(Teams.findOne(query1));
      if(!(teams_ref.signed_in_device === req.param('device'))) return RespService.e(res, 'device unkwown');
    } catch(err) { return RespService.e(res, 'device unkownnw'); }
    
    // Remove all the old data if it's there
    var query = {code: req.param('code')};
    try { await(Checkouts.destroy(query)); await(InCheckouts.destroy(query)); }
    catch(err) {}
    
    // Update team model
    var query2 = {code: req.param('code'), signed_in_device: req.param('device')};
    try {var teams_ref = await(Teams.update(query2, {ui: null, form: null, active_event: 'null'})); }
    catch(err) {}
    
    return RespService.s(res, teams_ref);
  }),
  
  /**
   * For roll: MASTER
   * 
   * This will merge the checkout back into the database.
   * 
   * Required params:
   * -content: the serialized RCheckout
   * -status: the status (eg 'Completed by Will D.')
   * -id: the matching local ID of the checkout to update (eg 0,1,etc)
   * -code: the team's code
   * -device: unique device identifier
   * 
   * Possible returns:
   * -string 'success': the checkout was updated successfully
   * -string 'Database fail: (error message)': something went wrong
   * -Missing a parameter
   * -Unauthenticated
   * 
   */
  pushCheckout: asyncHandler(function(req, res) {
    // Authenticate the user
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); }

    // Check for required params
    if(!req.param('content')) return RespService.e(res, 'Missing content');
    if(!req.param('code')) return RespService.e(res, 'Missing code');
    if(!req.param('device')) return RespService.e(res, 'Missing device ID');
    
    try {
      var query1 = {code: req.param('code'), signed_in_device: req.param('device')};
      var teams_ref = await(Teams.findOne(query1));
      if(!(teams_ref.signed_in_device === req.param('device'))) return RespService.e(res, 'device unkwown');
    } catch(err) { return RespService.e(res, 'device unkownnw'); }
    
    // Loop through the JSON array of received checkouts
    var classmem = JSON.parse(req.param('content'), 'utf8');
    var subitem;
    var item;
    for(item in classmem) {
      var cid = classmem[item].id;
      var status = classmem[item].status;
      
      var contente = classmem[item];
      var query = {code: req.param('code'), id: cid};
      
      try { await(Checkouts.update(query, {content: contente, last_edit: new Date().getTime() / 1000})); }
      catch(err) { return RespService.e(res, 'pushCheckout() failed with error: '+err); }
      
    }
    return RespService.s(res, 'success');
  }),
  
  /**
   * For roll: MASTER
   * 
   * This will pull all checkouts that scouters have marked as complete, after they're pulled, it will delete them from receivedCheckouts.
   * 
   * Required params:
   * -code: the team's code
   * -device: unique device identifier
   * 
   * Possible returns:
   * -object: items array: JSON array representing received checkouts
   * -string 'Database fail: (error message)': something went wrong
   * -Missing a parameter
   * -Unauthenticated
   * 
   */ 
  pullReceivedCheckouts: asyncHandler(function(req, res) {
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); }
    
    // check for required params
    if(!req.param('code')) return RespService.e(res, 'Missing team code');
    if(!req.param('device')) return RespService.e(res, 'Missing device ID');
    
        try {
      var query1 = {code: req.param('code'), signed_in_device: req.param('device')};
      var teams_ref = await(Teams.findOne(query1));
      if(!(teams_ref.signed_in_device === req.param('device'))) return RespService.e(res, 'device unkwown');
    } catch(err) { return RespService.e(res, 'device unkownnw'); }
    
    // query InCheckouts and see if there are any fields there for our team
    var query = {code: req.param('code')};
    try {
      // new array
      var toReturnItems = [];
        
      await(InCheckouts.find(query).exec(function(err, items) { // returns all received checkouts assosicated with this team
        
        // we've received all the team's checkouts, let's get rid of all the ones that don't match their last edit id
        for(i = 0; i < items.length; i++) {
          toReturnItems.push(items[i]); // looks like the checkout model was updated and we haven't received it yet, let's add it to our toReturn variable
        }
      }));
      
      // Delete all items that contain team code, since we've received them now
      await(InCheckouts.destroy(query));
      
      return RespService.s(res, toReturnItems);
      
    }
    catch(err) { return RespService.e(res, 'Database fail: '+err) };
  }),

  /**
   * For roll: SCOUTER
   * 
   * Updates the statuses of a group of checkout items
   * 
   * Required params:
   * -content: the serialized RCheckout model in string form
   * -code: the team code to mark these checkouts a part of
   * -active: the title of the active event
   * -device: unique device identifier
   * 
   * Possible returns:
   * -string 'success': everything was pushed succesfully
   * -string 'initPushCheckouts() failed with error: (error message)': something went wrong
   * -Missing a parameter
   * -Unauthenticated
   * 
   */
  pushCheckouts: asyncHandler( function (req, res) {
    // Authenticate the user
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); }

    // Check for required params
    if(!req.param('content')) return RespService.e(res, 'Missing content');
    if(!req.param('code')) return RespService.e(res, 'Missing code');
    
    // Loop through the JSON array of received checkouts
    var classmem = JSON.parse(req.param('content'), 'utf8');
    var subitem;
    var item;
    for(item in classmem) {
      var cid = classmem[item].id;
      var status = classmem[item].status;
      
      var contente = classmem[item];
      var query = {code: req.param('code'), id: cid};
      
      if(status.startsWith('Completed')) { // if we're uploading a completed checkout from scouter, then we'll send it to the master for merging
         var new_model = {content: contente, last_edit: new Date().getTime() / 1000, id: cid, code: req.param('code')};
         try { var created = await(InCheckouts.create(new_model)); 
         }
         catch(err) { 
           return RespService.e(res, 'pushCheckouts() failed with error: '+err); }
      } else { // ONLY update the master checkouts repo for status, if content needs updating, then it must be done from the master app
           try { await(Checkouts.update(query, {content: contente, last_edit: new Date().getTime() / 1000})); }
           catch(err) { return RespService.e(res, 'pushCheckouts() failed with error: '+err); }
      }
      
    }
    return RespService.s(res, 'success');
  }),
  

  /**
   * For roll: SCOUTER
   * 
   * Pulls checkouts from the Checkouts database. This method will be called A LOT (each client updates every couple seconds). In order to reduce
   * data costs, we require an array (like: 1,2,3,4,5 in string form) of 'last_sync_id' variables for each checkouts. That way, we will only
   * return checkouts that the SCOUTER hasn't received yet.
   * 
   * Required params:
   * -last_sync: epoch time in ms of last sync time
   * -code: the team's code
   * 
   * Possible returns:
   * -object: items: items that weren't in sync with local database
   * -string 'Database fail: (error message)': something went wrong
   * -Missing a parameter
   * -Unauthenticated
   * 
   */ 
  pullCheckouts: asyncHandler(function(req, res) {
    try { user = await(AuthService.authenticate_async(req, false)); }
    catch(err) { return RespService.e(res, "User authentication error:" + err); };
    
    // check for required params
    if(!req.param('last_sync')) return RespService.e(res, 'Missing last sync variable');
    if(!req.param('code')) return RespService.e(res, 'Missing team code');
    
    // look through checkouts
    var query = {code: req.param('code')};
    try { 
      await(Checkouts.find(query).exec(function(err, items) {
        // new array
        var toReturnItems = [];
        
        // we've received all the team's checkouts, let's get rid of all the ones that don't match their last edit id
        for(i = 0; i < items.length; i++) {
          if(req.param('last_sync') < items[i].last_edit) toReturnItems.push(items[i]); // looks like the checkout model was updated and we haven't received it yet, let's add it to our toReturn variable
        }
        return RespService.s(res, toReturnItems);
      }));

    }
    catch(err) { return RespService.e(res, 'Database fail: '+err) };

  }),
    
}