cube(`PaymentReceipts`, {
  sql: `SELECT * FROM kyanite.payment_receipts`,

  joins: {
    Clients: {
      sql: `${CUBE}.\`clientId\` = ${Clients}.id`,
      relationship: `belongsTo`
    },

    Suppliers: {
      sql: `${CUBE}.\`supplierId\` = ${Suppliers}.id`,
      relationship: `belongsTo`
    },

    ReceiptTypes: {
      sql: `${CUBE}.\`receiptTypeId\` = ${ReceiptTypes}.id`,
      relationship: `belongsTo`
    },

    AccountingImputations: {
      sql: `${CUBE}.\`accountingImputationId\` = ${AccountingImputations}.id`,
      relationship: `belongsTo`
    },

    BillingPeriods: {
      sql: `${CUBE}.\`periodId\` = ${BillingPeriods}.id`,
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
      drillMembers: [id, createdat, updatedat, emissiondate]
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },

    receiptnumber: {
      sql: `${CUBE}.\`receiptNumber\``,
      type: `string`
    },

    description: {
      sql: `description`,
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

    emissiondate: {
      sql: `${CUBE}.\`emissionDate\``,
      type: `time`
    },

    deletedat: {
      sql: `${CUBE}.\`deletedAt\``,
      type: `time`
    }
  }
});
