/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 */

module.exports.routes = {
// Users
//'GET /users/create_admin_user' : 'UsersController.create_admin_user', // TEMPORARY FUNCTION
'GET /users/signIn' : 'UsersController.signIn',

// Teams
'GET /teams/createTeam' : 'TeamsController.createTeam',
'POST /teams/deleteTeam' : 'TeamsController.deleteTeam',
'GET /teams/getTeam' : 'TeamsController.getTeam',
'GET /teams/regenerateToken' : 'TeamsController.regenerateToken',
'POST /teams/pushForm' : 'TeamsController.pushForm',
'GET /teams/pullForm' : 'TeamsController.pullForm',
'GET /teams/joinTeam' : 'TeamsController.joinTeam',
'POST /teams/pushUI' : 'TeamsController.pushUI',
'GET /teams/pullUI' : 'TeamsController.pullUI',
'GET /teams/getTeamAsAdmin' : 'TeamsController.getTeamAsAdmin',
'GET /teams/forceSignOut' : 'TeamsController.forceSignOut',
'GET /teams/isActive' : 'TeamsController.isActive',

// Checkouts
'POST /checkouts/initPushCheckouts' : 'CheckoutsController.initPushCheckouts',
'POST /checkouts/pushCheckout' : 'CheckoutsController.pushCheckout',
'GET /checkouts/pullReceivedCheckouts' : 'CheckoutsController.pullReceivedCheckouts',
'POST /checkouts/pushCheckouts' : 'CheckoutsController.pushCheckouts',
'GET /checkouts/pullCheckouts' : 'CheckoutsController.pullCheckouts',
'GET /checkouts/clearActiveEvent' : 'CheckoutsController.clearActiveEvent',

};
