cube(`Clients`, {
  sql: `SELECT * FROM kyanite.clients`,
  
  joins: {
    TaxCategories: {
      sql: `${CUBE}.\`taxCategoryId\` = ${TaxCategories}.id`,
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
    },
    
    functionalunitscount: {
      sql: `${CUBE}.\`functionalUnitsCount\``,
      type: `sum`
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    
    internalcode: {
      sql: `${CUBE}.\`internalCode\``,
      type: `string`
    },
    
    name: {
      sql: `name`,
      type: `string`
    },
    
    cuit: {
      sql: `cuit`,
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
