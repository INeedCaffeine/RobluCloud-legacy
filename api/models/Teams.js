module.exports = {
  attributes: {
    number:{
      // primary key team number I.e 4859
      primaryKey: true,
      type: 'text',
      notNull: true,
      unique: true,
    },
    master: {                   // the owner email address of the account, used mostly for support    
      type: 'text',
      unique: true,
      notNull: true,
    },
    secret: { // secret is a parameter chosen by the account owner that is used for support
      type: 'text',
      notNull: true,
    },
    code: {                     // code used to authenticate data requests by this team
      type: 'text',
      notNull: true,
      unique: true,
    },
    // some extra data for viewing and what not
    form: { // json serialized form class
      type: 'text'
    },
    last_edit: { // stores the last time this team was pushed, if a scouter's local value for it is less, it will be repulled
      type: 'integer',
      notNull: true,
      defaultsTo: 0
    },
    last_ui_edit: {
      type: 'integer',
      defaultsTo: 0
    },
    ui: { // json serialized UI values
      type: 'text'
    },
    signed_in_device: {
      type: 'text',
      notNull: true,
      defaultsTo: 'null',
    },
    active_event: {
      type: 'text',
      notNull: true,
      defaultsTo: 'null'
    }
  }
};