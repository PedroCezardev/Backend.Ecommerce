const port = 4000;
const username = 'pedrocezar';
const password = encodeURIComponent('@Pedrdev01');
const cluster = 'ecommerce.0tfzdmn.mongodb.net';
const dbname = 'e-commerce';
const hostname = 'localhost';

const dbUri = `mongodb+srv://${username}:${password}@${cluster}/${dbname}`;

module.exports = {
  serverConfig: {
    port,
    hostname,
  },
  dbConfig: {
    dbUri,
  },
};
