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

// Teams
'GET /teams/getTeam' : 'TeamsController.getTeam',
'GET /teams/isActive' : 'TeamsController.isActive',
'GET /teams/regenerateCode' : 'TeamsController.regenerateCode',
'POST /teams/pushForm' : 'TeamsController.pushForm',
'POST /teams/pushUI' : 'TeamsController.pushUI',

// Checkouts
'POST /checkouts/init' : 'CheckoutsController.init',
'GET /checkouts/purge' : 'CheckoutsController.purge',
'POST /checkouts/pushMetaChanges' : 'CheckoutsController.pushMetaChanges',
'POST /checkouts/pushCheckouts' : 'CheckoutsController.pushCheckouts',
'GET /checkouts/pullCheckouts' : 'CheckoutsController.pullCheckouts',
'GET /checkouts/pullCompletedCheckouts' : 'CheckoutsController.pullCompletedCheckouts',

// Admin
'GET /admin/getTeam': 'AdminController.getTeam',
'GET /admin/createTeam': 'AdminController.createTeam',
'GET /admin/deleteTeam': 'AdminController.deleteTeam',
'GET /admin/regenerateCode': 'AdminController.regenerateCode',
};
