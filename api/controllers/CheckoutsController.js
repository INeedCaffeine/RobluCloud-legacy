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
    try { team = await(TeamAuthService.authenticate_async(req, false)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    // Check for required params
    if (!req.param('code') || !req.param('number') || !req.param('active_event_name') || !req.param('form') || !req.param('ui') || !req.param('tbaKey')) return RespService.e(res, 'Missing a parameter.');

    // Get a team model reference
    try {
      var query = {code: req.param('code')};
      await(Teams.update(query, {
        number: req.param('number'), active_event_name: req.param('active_event_name')
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
      var new_checkout = { id: cid, content: ccontent, status: 0, code: req.param('code')};
      try { await(Checkouts.create(new_checkout)); } // Add the checkouts to the Checkouts model
      catch(err) {}
    }

    return RespService.s(res, true);
  }),

  /*
   * Removes all scouting data for an event and the team's syncing system as in-active
   */
  purge: asyncHandler(function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req, false)); }
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
    try { team = await(TeamAuthService.authenticate_async(req, false)); }
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

      try { await(Checkouts.update(query, {content: classmem[item], status: status2})); }
      catch(err) { return RespService.e(res, 'pushCheckout() failed with error: '+err); }
      
    }
    return RespService.s(res, 'success');
  }),

  /*
   * Pulls all checkouts with verified time stamp
   */
  pullCheckouts: asyncHandler(function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req, true)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    // check for required params
    if (!req.param('syncIDs')) return RespService.e(res, 'Missing a parameter');

    var query = { code: req.param('code') };
    // If the team number was sent to the server, we must determine the team's code based off their number
    if(req.param('teamNumber')) {
      try {
        var query2 = {official_team_name: req.param('teamNumber') };
        var teams_ref = await(Teams.findOne(query2));

        if (teams_ref.opted_in) {
          query = { code: teams_ref.code };
        }

      } catch (err) {
        return RespService.e(res, 'Error: ' + err);
      }
    }

    if (req.param('all')) {
      try {
        // new array
        var toReturnItems = [];

        await(Checkouts.find(query).exec(function (err, items) { // returns all received checkouts assosicated with this team
   
          for (i = 0; i < items.length; i++) {
                toReturnItems.push(items[i]);
          }

          return RespService.s(res, toReturnItems);
        }));

      }
      catch (err) { return RespService.e(res, 'Database fail: ' + err) };

    } else {
      try {
        // new array
        var toReturnItems = [];

        // For processing the checkout sync IDs
        var classmem = JSON.parse(req.param('syncIDs'), 'utf8');
        var subitem;
        var item;

        await(Checkouts.find(query).exec(function (err, items) { // returns all received checkouts assosicated with this team

          for (i = 0; i < items.length; i++) {

            /*
             * Alright, we should only return the checkout if the server checkout ID does NOT match the received checkout Id
             */
            for (item in classmem) {
              // Get the variables for this checkout
              var id2 = classmem[item].checkoutID;
              var syncID2 = classmem[item].syncID;

              if ((classmem[item].checkoutID == items[i].id) && (classmem[item].syncID != items[i].syncID)) {
                toReturnItems.push(items[i]);
              }
            }
          }

          return RespService.s(res, toReturnItems);
        }));

      }
      catch (err) { return RespService.e(res, 'Database fail: ' + err) };
    }
  }),
  /*
   * Pulls all checkouts with verified time stamp and status==2 so the master app can parse them
   */
  pullCompletedCheckouts: asyncHandler(function (req, res) {
    try { team = await(TeamAuthService.authenticate_async(req, true)); }
    catch (err) { return RespService.e(res, 'Unable to authenticate with provided team code.'); };

    // check for required params
    if (!req.param('syncIDs')) return RespService.e(res, 'Missing a parameter');

    var query = { code: req.param('code') };
    // If the team number was sent to the server, we must determine the team's code based off their number
    if (req.param('teamNumber')) {
      try {
        var query2 = { official_team_name: req.param('teamNumber') };
        var teams_ref = await(Teams.findOne(query2));

        if (teams_ref.opted_in) {
          query = { code: teams_ref.code };
        }

      } catch (err) {
        return RespService.e(res, 'Error: ' + err);
      }
    }

    try {
      // new array
      var toReturnItems = [];

      // For processing the checkout sync IDs
      var classmem = JSON.parse(req.param('syncIDs'), 'utf8');
      var subitem;
      var item;

      await(Checkouts.find(query).exec(function (err, items) { // returns all received checkouts assosicated with this team

        for (i = 0; i < items.length; i++) {

          /*
           * Alright, we should only return the checkout if the server checkout ID does NOT match the received checkout Id
           */
          for (item in classmem) {
            // Get the variables for this checkout
            var id2 = classmem[item].checkoutID;
            var syncID2 = classmem[item].syncID;

            if ((items[i].status == 2) && (classmem[item].checkoutID == items[i].id) && (classmem[item].syncID != items[i].syncID)) {
              toReturnItems.push(items[i]);
            }
          }
        }

        return RespService.s(res, toReturnItems);
      }));

    }
    catch (err) { return RespService.e(res, 'Database fail: ' + err) };
  }),

}
