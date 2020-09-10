cube(`ClientAmmenities`, {
  sql: `SELECT * FROM kyanite.client_ammenities`,
  
  joins: {
    Clients: {
      sql: `${CUBE}.\`clientId\` = ${Clients}.id`,
      relationship: `belongsTo`
    },
    
    Ammenities: {
      sql: `${CUBE}.\`ammenityId\` = ${Ammenities}.id`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    }
  }
});
