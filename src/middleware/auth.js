const User = require('../models/user');
const jwt = require('jsonwebtoken');

async function auth( ctx ) {
    try {
        const token = ctx.req.headers['authorization'].replace('Bearer ',''); // Bearer token
        const decode = jwt.verify(token,'thisissecretforjwt');
       
        // 在tokens数组中找对应token
        const user = await User.findOne({_id: decode._id,'tokens.token':token});
        if(!user){
            throw new Error()
        }
        ctx.token=token;
        ctx.user=user; //中间件中已经获得了token，后续router可以直接从ctx中取下来用
    }catch(err){
        ctx.status = 401;
        ctx.body={error: "You need to auth"}
    }
}

module.exports = function () {
  return async function ( ctx, next ) {
    await auth(ctx);
    await next()
  }
}