cube(`PaymentReceiptsImages`, {
  sql: `SELECT * FROM kyanite.payment_receipts_images`,
  
  joins: {
    PaymentReceipts: {
      sql: `${CUBE}.\`paymentReceiptId\` = ${PaymentReceipts}.id`,
      relationship: `belongsTo`
    },
    
    Users: {
      sql: `${CUBE}.\`userId\` = ${Users}.id`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [id, name, originalname, createdat, updatedat]
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
    },
    
    originalname: {
      sql: `${CUBE}.\`originalName\``,
      type: `string`
    },
    
    publicurl: {
      sql: `${CUBE}.\`publicUrl\``,
      type: `string`
    },
    
    authenticatedurl: {
      sql: `${CUBE}.\`authenticatedUrl\``,
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
