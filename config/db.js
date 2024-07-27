const mongoose = require("mongoose");

const { dbConfig } = require("./index");

mongoose.connect(dbConfig.dbUri, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
}).then(
  () => console.log('Conectado ao MongoDB')
).catch(
  err => console.error('Erro ao conectar ao MongoDB:', err)
);

module.exports = mongoose;