
module.exports = {
  attributes: {
    /*
     * Identifier items
     */
    code: { // Code is the short string value used to identify which team this model belongs to on the server
      type: 'text',
      notNull: true,
    },
    id: { // ID is the numerical unqiue identifier for this checkout, it's used to identify this transfer model, it should match between Roblu Master, this server, and Roblu Scouter
      type: 'integer',
      notNull: true,
    },

    /*
     * Meta-data
     */
    status: { // an integer status representing the state of this Checkout
      type: 'integer'
    },
    sync_id: { // essentially the version number of this checkout, if this doesn't match a local version, then the checkout should be re-pulled
      type: 'integer',
      defaultsTo: 0,
    },

    /*
     * Content transfer
     */
    content: { // this contains serialized and compressed information that the server can't actually read, it contains all the scouting data
      type: 'object',
    },
  }
};
