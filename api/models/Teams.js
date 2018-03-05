/*
 * The teams model does NOT correlate with the RTeam model found in Roblu Master and Roblu Scouter. 
 * It's used to identify a team on the Roblu Server, and contains some general identification info and meta-data.
 * The team code is top secret, and is the only piece of information required to make changes to a team.
 *
 * Team contains some server helper variables, some meta-data items, and some content items.
 *
 */
module.exports = {
  attributes: {
    /*
     * Server identification variables, these are variables that are only really important because we're using a server, this is basically account information
     */
    code: { // this is the unique code by which this team is identified, it should be kept top secret!
      type: 'text',
      notNull: true,
      unique: true,
      primaryKey: true,
    },
    official_team_name: { // the official FRC team name
      type: 'text',
      notNull: true,
    },
    owner_email: { // the owner email address for this account, used only for support purposes
      type: 'text',
      unique: true,
      defaultsTo: '',
      notNull: true,
    },
    secret: { // secret is a parameter used as extra verification for support purposes
      type: 'text',
      notNull: true,
    },

    /*
     * Meta-data level items
     */
    number: { // the server only stores the FRC number as sort of courtesy value, different Scouter clients can make use of it for handy UI features, such as "My matches", but it's not required for core functionality
      type: 'integer',
      defaultsTo: 0,
    },
    active_event_name: { // stores the name of the active event, not required for core functionality
      type: 'text',
      notNull: true,
      defaultsTo: '',
    },
    tba_event_key: {
      type: 'text',
      notNull: true,
      defaultsTo: '',
    },
    sync_id: { // returns the last time either FORM or UI were pushed.
      type: 'integer',
      defaultsTo: 0,
      autoIncrement: true,
    },
    active: { // stores whether an active event exists, if false, no syncing should occur
      type: 'boolean',
      defaultTo: false,
    },
    opted_in: { // specifies whether this team's scouting data should be available with their FRC team number. If opted in, any team can use pullCheckouts(), pullCompletedCheckouts(), and getTeam()
      type: 'boolean',
      defaultTo: false,
    },

    /*
     * Content level items
     * These items are serialized and compressed, so the server won't actually be able to read them
     */
    form: { // stores the RForm model
      type: 'text',
      notNull: true,
      defaultsTo: '',

    },
    ui: { // stores the UI model
      type: 'text',
      notNull: true,
      defaultsTo: '',
    },
    
  }
};
