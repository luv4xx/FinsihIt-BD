const mongoose = require('mongoose');

const url = 'mongodb://127.0.0.1:27017/';
const dbname = 'finish-api';
mongoose.connect(`${url}${dbname}`,{useNewUrlParser: true, useUnifiedTopology: true})


