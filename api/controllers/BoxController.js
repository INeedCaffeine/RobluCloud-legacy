var async = require('asyncawait/async');
var await = require('asyncawait/await');
var asyncHandler = require('async-handler')(async, await);
var bcrypt = require('bcrypt-nodejs');  // module used to hash passwords

module.exports = {
  submitScore: asyncHandler( function (req, res) {
    if(!req.param('id')) return RespService.e(res, 'Missing id');
    if(!req.param('score')) return RespService.e(res, 'Missing score');
    
    try {
        // Check if the player already exists
        var query = {id: req.param('id')};
        var player_ref = await(Players.findOne(query));
        
        // Player doesn't exit
        if(player_ref == null) {
            try {
                var new_player = {id: req.param('id'), score: req.param('score')};
                await(Players.create(new_player));
            } catch(err) {
                return RespService.e(res, 'Failed to create user '+err);
            }
        
        } else {
        // update the value if player already exists
            try {
                await(Players.update(query, {score: req.param('score')}));
            } catch(err) {
                // It doesn't exist, create new user
                return RespService.e(res, 'Failed to update player value');
            }
        }
        
    } catch(err) {
        // user didn't exist, create new user
        return RespService.e(res, 'Error');
        
    }
    
    var toReturnItems = [];
    // calculate our rank
    var rank = 1;
    try {
    Players.find({}).exec(function(err, items) { // returns all received checkouts assosicated with this team
        // we've received all the team's checkouts, let's get rid of all the ones that don't match their last edit id
        var players = 0;
        for(i = 0; i < items.length; i++) {
            if(items[i].score == 0) continue;
            
            if(items[i].score > req.param('score')) rank++;
            players++;
        }
        
        return RespService.s(res, rank+':'+players);
      });
    } catch(err)  {
        return RespService.e(res, 'Error: '+err);
    }


  }),
};
