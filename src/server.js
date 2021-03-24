const Koa = require('koa');
require('./db/mongoose'); // run db
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser');

const userRouter = require('./routers/user');
const todoRouter = require('./routers/todo');

const app= new Koa();

app.use(bodyParser()); 
app.use(cors());

app.use(userRouter.routes());
app.use(todoRouter.routes());



app.listen(8001);
console.log('server is listening on 8001')
