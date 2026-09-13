const crypto = require('crypto');

function calculateDueDate(startDate, days) {
  const due = new Date(startDate);
  due.setDate(due.getDate() + days);
  return due;
}

function generateBarcode() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

module.exports = { calculateDueDate, generateBarcode };
