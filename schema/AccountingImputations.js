cube(`AccountingImputations`, {
  sql: `SELECT * FROM kyanite.accounting_imputations`,
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name]
    },
    
    account: {
      sql: `account`,
      type: `sum`
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    name: {
      sql: `name`,
      type: `string`
    }
  }
});
