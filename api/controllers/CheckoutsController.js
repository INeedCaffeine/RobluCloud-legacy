var async = require('asyncawait/async');
var await = require('asyncawait/await');
var asyncHandler = require('async-handler')(async, await);
var bcrypt = require('bcrypt-nodejs');

/*
 * CheckoutsController manages the Checkouts database, where all the scouting data is located
 */
module.exports = {

  /*
   * Uploads a new event to the server and flags the sync system as active.
   */
  init: asyncHandler( function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    // Check for required params
    if (!req.param('code') || !req.param('number') || !req.param('active_event_name') || !req.param('form') || !req.param('ui') || !req.param('tbaKey')) return RespService.e(res, 'Missing a parameter.');

    // Get a team model reference
    try {
      var query = {code: req.param('code')};
      await(Teams.update(query, {
        number: req.param('number'), active_event_name: req.param('active_event_name'), last_content_edit: (Date.now() / 1000 | 0)
        , form: req.param('form'), ui: req.param('ui'), active: true, tba_event_key: req.param('tbaKey')
      }));
    } catch(err) { return RespService.e(res, 'Failed to update team model'); }
    
    // Remove old data from checkouts if applicable
    var query = {code: req.param('code')};
    try { await(Checkouts.destroy(query)); }
    catch(err) {}
    
    // Loop through the JSON array of received checkouts
    var classmem = JSON.parse(req.param('content'), 'utf8');
    var item;
    for(item in classmem) {
      var cid = classmem[item].id;
      var ccontent = classmem[item];
      var new_checkout = { id: cid, content: ccontent, time: (Date.now() / 1000 | 0), status: 0, code: req.param('code')};
      try { await(Checkouts.create(new_checkout)); } // Add the checkouts to the Checkouts model
      catch(err) {}
    }

    return RespService.s(res, true);
  }),

  /*
   * Removes all scouting data for an event and the team's syncing system as in-active
   */
  purge: asyncHandler(function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    // Check for required params
    if(!req.param('code')) return RespService.e(res, 'Missing code');

    // Reset all the team model data
    try {
      var query1 = {code: req.param('code')};
      var teams_ref = await(Teams.findOne(query1));
      await(Teams.update(query1, { active: false, active_event_name: '', last_content_edit: 0, form: '', ui: ''}));
    } catch(err) { return RespService.e(res, 'database fail'); }
    
    // Remove all the old data if it's there
    var query = {code: req.param('code')};
    try { await(Checkouts.destroy(query)); }
    catch(err) {}
    
    return RespService.s(res, teams_ref);
  }),
  /*
   * Updates the content and status for multiple checkouts
   */
  pushCheckouts: asyncHandler(function(req, res) {
    try { team = await(TeamAuthService.authenticate_async(req)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    // Check for required params
    if(!req.param('content')) return RespService.e(res, 'Missing content');
    if(!req.param('code')) return RespService.e(res, 'Missing code');
    
    // Loop through the JSON array of received checkouts
    var classmem = JSON.parse(req.param('content'), 'utf8');
    var subitem;
    var item;
    for (item in classmem) {
      // Get the variables for this checkout
      var id2 = classmem[item].id;
      var status2 = classmem[item].status;
      var query = {code: req.param('code'), id: id2};

      /*
       * Why is 120 seconds added to the time? This is a bit complicated, but let me explain.
       * Let's say that a scouter just pushed a checkout, but simultaneously, a Roblu Master app is
       * is completing a sync (where checkouts where found) that is occuring at exactly the same
       * time as this is getting imported. What will happen is that the Roblu Master will receive
       * a timestamp that is ahead of data that is just being updated. So make sure we give a buffer,
       * in this case, 120 seconds past the current time, to prevent this issue.
       */ 
      try { await(Checkouts.update(query, { content: classmem[item], status: status2, time: (Date.now() / 1000 | 0) + 120})); }
      catch(err) { return RespService.e(res, 'pushCheckout() failed with error: '+err); }
      
    }
    return RespService.s(res, 'success');
  }),

  /*
   * Pulls all checkouts with verified time stamp
   */
  pullCheckouts: asyncHandler(function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    // check for required params
    if (!req.param('code') || !req.param('time')) return RespService.e(res, 'Missing a parameter');

    var query = { code: req.param('code') };
    try {
      // new array
      var toReturnItems = [];

      await(Checkouts.find(query).exec(function (err, items) { // returns all received checkouts assosicated with this team

        for (i = 0; i < items.length; i++) {
          // Only receive the checkout if it's completed and verified with the submitted time stamp
          if ((req.param('time') / 1000 | 0) <= items[i].time) toReturnItems.push(items[i]);
        }

        return RespService.s(res, toReturnItems);
      }));

    }
    catch (err) { return RespService.e(res, 'Database fail: ' + err) };
  }),
  /*
   * Pulls all checkouts with verified time stamp and status==3 so the master app can parse them
   */
  pullCompletedCheckouts: asyncHandler(function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    // check for required params
    if (!req.param('code') || !req.param('time')) return RespService.e(res, 'Missing a parameter');

    var query = { code: req.param('code') };
    try {
      // new array
      var toReturnItems = [];

      await(Checkouts.find(query).exec(function (err, items) { // returns all received checkouts assosicated with this team

        for (i = 0; i < items.length; i++) {
          // Only receive the checkout if it's completed and verified with the submitted time stamp
          if (items[i].time >= (req.param('time') / 1000 | 0) && items[i].status == 2) toReturnItems.push(items[i]);
        }

        return RespService.s(res, toReturnItems);
      }));
    }
    catch (err) { return RespService.e(res, 'Database fail: ' + err) };
  }),

}
