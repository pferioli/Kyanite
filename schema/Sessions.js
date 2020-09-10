cube(`Sessions`, {
  sql: `SELECT * FROM kyanite.sessions`,
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [sessionId]
    }
  },
  
  dimensions: {
    sessionId: {
      sql: `session_id`,
      type: `string`
    },
    
    data: {
      sql: `data`,
      type: `string`
    }
  }
});
