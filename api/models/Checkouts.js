
/* Several things need to happen as far as checkouts go:
 *
 * -Each checkout will have an ID, this is simply just it's row # (starting at 0)
 * -We need to have a way to pull an array that contains IDs and currently checked out to, without pulling all the data
 * -When the master accepts a checkout into the local repoistory, it must be re-uploaded to the server and overwrite the server's checkout
 * -If master decides to switch active event, clear the entire checkout db
 *
 * If a scouter overrides a "currently checked out" item:
 * a) update the status of that checkout to "overriden by: ";
 * b) client who had orginially checked out the checkout will be revoked access to it
 *
 */
module.exports = {
  attributes: {
    id:{ // id should match the order in which checkouts are received
      type: 'integer',
      primarKey: true,
    },
    code: { // the team code this checkout is a part of
      type: 'text'
    },
    content: { // the content of this string, in gson form (can be deserialized into an RCheckout mode)
      type: 'object',
    },
    last_edit: { // stores the last time this checkout was edited, to reduce data transfers
      type: 'integer',
      notNull: true,
      defaultsTo: 0
    }
  }
};