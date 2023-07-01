const mongodb = require('mongodb');

const mongoClient = mongodb.MongoClient;
let _db;

const mongoConnect = (callBack) => {
  mongoClient
    .connect(
      'mongodb+srv://nipunpatel7:dwxBHvrxMqoG7gVJ@cluster0.8lu6sfp.mongodb.net/?retryWrites=true&w=majority'
    )
    .then((result) => {
      _db = result.db();
      console.log('connected!');
      callBack(result);
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw 'No database found';
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
