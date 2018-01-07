
/*
RCheckout is the most important model in the Roblu Scouting System.
This model contains all information sent in a scouting data transfer.


 */
module.exports = {
  attributes: {
    // Code is the 
    code: {
      type: 'text'
    },
    // ID is the numerical unqiue identifier for this checkout, it's used to identify this transfer model, it should match between Roblu Master, this server, and Roblu Scouter
    id: {
      type: 'integer',
      primaryKey: true,
      unique: true,
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
