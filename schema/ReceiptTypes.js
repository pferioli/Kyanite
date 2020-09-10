cube(`ReceiptTypes`, {
  sql: `SELECT * FROM kyanite.receipt_types`,
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name]
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    receipttype: {
      sql: `${CUBE}.\`receiptType\``,
      type: `string`
    },
    
    name: {
      sql: `name`,
      type: `string`
    }
  }
});
