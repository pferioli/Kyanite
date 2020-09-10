cube(`Suppliers`, {
  sql: `SELECT * FROM kyanite.suppliers`,
  
  joins: {
    TaxCategories: {
      sql: `${CUBE}.\`taxCategoryId\` = ${TaxCategories}.id`,
      relationship: `belongsTo`
    },
    
    Banks: {
      sql: `${CUBE}.\`bankId\` = ${Banks}.id`,
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
      drillMembers: [id, name, city, createdat, updatedat]
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
    
    cuit: {
      sql: `cuit`,
      type: `string`
    },
    
    bankaccount: {
      sql: `${CUBE}.\`bankAccount\``,
      type: `string`
    },
    
    address: {
      sql: `address`,
      type: `string`
    },
    
    city: {
      sql: `city`,
      type: `string`
    },
    
    zipcode: {
      sql: `${CUBE}.\`zipCode\``,
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
