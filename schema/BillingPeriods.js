cube(`BillingPeriods`, {
  sql: `SELECT * FROM kyanite.billing_periods`,

  joins: {
    Clients: {
      sql: `${CUBE}.\`clientId\` = ${Clients}.id`,
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
      drillMembers: [id, name, createdat, updatedat, startdate, enddate]
    },
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

    createdat: {
      sql: `${CUBE}.\`createdAt\``,
      type: `time`
    },

    updatedat: {
      sql: `${CUBE}.\`updatedAt\``,
      type: `time`
    },

    startdate: {
      sql: `${CUBE}.\`startDate\``,
      type: `time`
    },

    enddate: {
      sql: `${CUBE}.\`endDate\``,
      type: `time`
    },

    openedat: {
      sql: `${CUBE}.\`openedAt\``,
      type: `time`
    },

    closedat: {
      sql: `${CUBE}.\`closedAt\``,
      type: `time`
    },

    deletedat: {
      sql: `${CUBE}.\`deletedAt\``,
      type: `time`
    }
  }
});
