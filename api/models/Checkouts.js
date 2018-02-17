
/*
 * RCheckout is the most important model in the Roblu Scouting System.
 * This model contains all information sent in a scouting data transfer.
 *
 *  Note the meta-data section, which various Roblu clients will need read/write access to
 *
 *  Let's go over an ***IMPORTANT*** lesson on the status meta-data tag
 *  If status is equal to...
 *     0 - the checkout is available, when any client requests a sync (and sync is verified by timestamp), the entire checkout model will be included in the return response
 *     1 - the checkout is currently checked out to a user, when any client requests a sync (and sync is verified by timestamp), only the meta-data should be returned
 *     2 - this status represents "locally checked out", to the server, it's the same meaning as status==
 *     3 - the checkout is completed, when any client requests a sync (and sync is verified by timestamp), the entire checkout model will be included in the return response
 *
 *  Let's review 2 concepts that need to be defined further:
 *       -"sync is verified by timestamp" means that the server's time stamp is GREATER THAN the requesting clients time stamp
 *       -the client will use 2 sync methods, "pullCheckoutMeta" and "pullCheckouts", pullCheckoutMeta will return all checkouts with verified timestamp and status==1 or status==2,
 *        pullCheckouts will return all checkouts with verified timestamp, and status==0 or status==3       
 *
 *  Upload procedures:
 *       -to change a checkout's meta status, use CheckoutsController.pushMetaChanges()
 *       -to change a checkout's content, use CheckoutsController.pushCheckouts()
 *
 *
 */
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
    time: { // stores the last time this checkout was edited, helps to reduce data transfers, UNIX seconds format
      type: 'bigint',
      notNull: true,
      defaultsTo: 0
    },

    /*
     * Content transfer
     */
    content: { // this contains serialized and compressed information that the server can't actually read, it contains all the scouting data
      type: 'object',
    },
  }
};
