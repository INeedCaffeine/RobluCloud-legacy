module.exports = {
  attributes: {
    id:{
      type: 'text',
      unique: true,
      notNull: true,
    },
    score:{
        type: 'integer'
    },
    common: {
      type: 'integer',
      defaultsTo: 0
    }
  }
};