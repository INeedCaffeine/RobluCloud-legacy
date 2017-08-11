module.exports = {
  attributes: {
    email: {                   // email address of the user
      primaryKey: true,
      type: 'text',
      notNull: true,
    },
    name: {                  // display name of the user
      type: 'text',
      notNull: true,
    },
    auth: {                 //randomly-generated code to use for all server calls
      type: 'text',
      unique: true,
      notNull: true,
    },
    admin: {                  //ref teams model
      type: 'boolean',
      notNull: true,
      defaultsTo: false,
    },
  }
};