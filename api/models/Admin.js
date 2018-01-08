/*
 * An Admin needs to be able to make changes to the server that no other user can. We'd don't require
 * a user model for any user but the Admin for authentication purposes.
 */
module.exports = {
  attributes: {
    // Each admin will have a really long randomly generated string that will let them get onto the server
    auth: {
      type: 'text',
      unique: true,
      notNull: true,
    },
  }
};
