cube(`HomeOwners`, {
  sql: `SELECT * FROM kyanite.home_owners`,
  
  joins: {
    Clients: {
      sql: `${CUBE}.\`clientId\` = ${Clients}.id`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name, createdat, updatedat]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    property: {
      sql: `property`,
      type: `string`
    },
    
    name: {
      sql: `name`,
      type: `string`
    },
    
    phone: {
      sql: `phone`,
      type: `string`
    },
    
    email: {
      sql: `email`,
      type: `string`
    },
    
    cuil: {
      sql: `cuil`,
      type: `string`
    },
    
    comments: {
      sql: `comments`,
      type: `string`
    },
    
    createdat: {
      sql: `${CUBE}.\`createdAt\``,
      type: `time`
    },
    
    updatedat: {
      sql: `${CUBE}.\`updatedAt\``,
      type: `time`
    },
    
    deletedat: {
      sql: `${CUBE}.\`deletedAt\``,
      type: `time`
    }
  }
});
