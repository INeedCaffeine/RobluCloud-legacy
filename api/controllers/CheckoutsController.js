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
        number: req.param('number'), active_event_name: req.param('active_event_name'), last_content_edit: new Date()
        , form: req.param('form'), ui: req.param('ui'), active: true, tba_event_key: req.param('tbaKey')
      }));
    } catch(err) { return RespService.e(res, 'Failed to update team model'); }
    
    // Remove old data from checkouts if applicable
    var query = {code: req.param('code')};
    try { await(Checkouts.destroy(query)); }
    catch(err) {}

    var newTimeStamp = new Date();

    // Loop through the JSON array of received checkouts
    var classmem = JSON.parse(req.param('content'), 'utf8');
    var item;
    for(item in classmem) {
      var cid = classmem[item].id;
      var ccontent = classmem[item];
      var new_checkout = { id: cid, content: ccontent, time: newTimeStamp, status: 0, code: req.param('code')};
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
      await(Teams.update(query1, { active: false, active_event_name: '', form: '', ui: ''}));
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
  pushCheckouts: asyncHandler(function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };
    
    // Check for required params
    if(!req.param('content')) return RespService.e(res, 'Missing content');
    if(!req.param('code')) return RespService.e(res, 'Missing code');
    
    // Loop through the JSON array of received checkouts
    var classmem = JSON.parse(req.param('content'), 'utf8');
    var subitem;
    var item;
    
    for(item in classmem) {
      // Get the variables for this checkout
      var id2 = classmem[item].id;
      var status2 = classmem[item].status;
      var query = {code: req.param('code'), id: id2};

      // Temporary logging
      var time = new Date().getTime();
      console.log('Updated timestamp: ' + time);

      try { await(Checkouts.update(query, {content: classmem[item], status: status2, time: new Date()})); }
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
          if (req.param('time') <= items[i].time.getTime()) toReturnItems.push(items[i]);
        }

        return RespService.s(res, toReturnItems);
      }));

    }
    catch (err) { return RespService.e(res, 'Database fail: ' + err) };
  }),
  /*
   * Pulls all checkouts with verified time stamp and status==2 so the master app can parse them
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

          if (items[i].id == 22) {
            console.log('Received date: ' + req.param('time') + ' SErver time: ' + items[i].time.getTime());
            console.log(items[i].time >= req.param('time'))
          }

          // Only receive the checkout if it's completed and verified with the submitted time stamp
          if ((items[i].status == 2) && (items[i].time >= req.param('time'))) {
            console.log('Accepted item with id: ' + items[i].id);

            toReturnItems.push(items[i]);
          }
        }

        return RespService.s(res, toReturnItems);
      }));
    }
    catch (err) { return RespService.e(res, 'Database fail: ' + err) };
  }),

}
