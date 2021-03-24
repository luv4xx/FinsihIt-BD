const Router =require('koa-router');
const User = require('../models/user');
const auth = require('../middleware/auth');

const userRouter = new Router({
	prefix: '/api'
});


userRouter.get('/', async (ctx, next) => {
	ctx.body='hello finishIt api server'
})

userRouter.post('/users',async (ctx,next)=>{
	const user = new User(ctx.request.body);
	try {
		await user.save();
		// 新创建用户后默认就已经登陆了
		const token = await user.generateJWT();
		ctx.response.status = 201;
		ctx.body = {user, token}
	}catch(err){
		ctx.status = 400;
		ctx.body=err;
	}
})

userRouter.get('/users',auth()  ,async (ctx,next)=>{
	try {
		const users = await User.find({});
		ctx.body = users;
	}catch(err){
		ctx.status=500;
	}
})

userRouter.get('/users/self',auth()  ,async (ctx,next)=>{
	try {
		ctx.body = ctx.user;
	}catch(err){
		ctx.status=500;
	}
})


// userRouter.get('/users/:id',async (ctx,next)=>{
// 	const _id = ctx.params.id;
// 	try {
// 		const user = await  User.findById(_id);
// 		if(!user) {
// 			ctx.status = 404;
// 			return;
// 		}
// 		ctx.body=user;
// 	}catch(err){
// 		ctx.status = 500;
// 	}
// })


// userRouter.patch('/users/:id',async (ctx,next)=>{
// 	const _id = ctx.params.id;
// 	const updates = Object.keys(ctx.request.body);
// 	const legalProps = ["name","email","password"]
// 	const passed = updates.every((p)=> legalProps.includes(p))

// 	if(!passed) {
// 		ctx.status = 400;
// 		ctx.body = {error: "invalid updates!"}
// 	}

// 	try {
//         // 保证在存入前执行mongoose middleware的fn
//         const user = await User.findById(_id);
//         updates.forEach(p=>{
//             user[p] = ctx.request.body[p];
//         })
//         await user.save();
// 		// const user = await  User.findByIdAndUpdate(_id,ctx.request.body,{
// 		// 	new: true, //返回修改后的user
// 		// 	runValidators: true // 修改时run validator
// 		// });
// 		// no find
// 		if(!user) {
// 			ctx.status = 404;
// 			return;
// 		}

// 		ctx.body=user;
// 	}catch(err){
// 		// 无法成功修改改id对应user
// 		ctx.status = 400;
// 		ctx.body=err;
// 	}
// })

// 已登录用户可以编辑自己的账户
userRouter.patch('/users/self',auth(), async (ctx,next)=>{
	const _id = ctx.user._id;
	const updates = Object.keys(ctx.request.body);
	const legalProps = ["name","email","password"]
	const passed = updates.every((p)=> legalProps.includes(p))

	if(!passed) {
		ctx.status = 400;
		ctx.body = {error: "invalid updates!"}
	}

	try {
        updates.forEach(p=>{
           ctx.user[p] = ctx.request.body[p];
        })
        await  ctx.user.save();
		ctx.body=ctx.user;
	}catch(err){
		// 无法成功修改改id对应user
		ctx.status = 400;
		ctx.body=err;
	}
})


// userRouter.delete('/users/:id',async (ctx,next)=>{
// 	const _id = ctx.params.id;
	
// 	try {
// 		const user = await  User.findByIdAndDelete(_id);
// 		// no find
// 		if(!user) {
// 			ctx.status = 404;
// 			return;
// 		}

// 		ctx.body=user;
// 	}catch(err){
// 		ctx.status = 500;
// 	}
// })


// 对于用户来说，只能已登录用户删除自己的账户
userRouter.delete('/users/self',auth(),async (ctx,next)=>{
	try {
		// const user = await  User.findByIdAndDelete(ctx.user._id);
		// ctx.body=user;
		await ctx.user.remove();
		ctx.body = ctx.user;
	}catch(err){
		ctx.status = 500;
	}
})

// user login
// if user is not reg,then reg
userRouter.post('/users/login',async (ctx,next)=>{
    try  {
        const user = await User.findByCredentials(ctx.request.body.email,ctx.request.body.password);
		if(user===null){ //邮箱不存在则自动进行注册
			const user = new User(ctx.request.body);
			try {
				await user.save();
				// 新创建用户后默认就已经登陆了
				const token = await user.generateJWT();
				ctx.response.status = 201;
				ctx.body = {user, token}
			}catch(err){
				ctx.status = 400;
				ctx.body={error: err,message: '输入信息有误!'};
			}
		}else{
			const token = await user.generateJWT();
			ctx.body = {user, token};
		}
    }catch(err){
        ctx.status = 400;
		ctx.body={error: err,message: '输入信息有误!'};
    }
})

// user logout - for single token
userRouter.post('/users/logout',auth(),async (ctx,next)=>{
    try  {
        ctx.user.tokens = ctx.user.tokens.filter((t)=> t.token!==ctx.token);
		await ctx.user.save();
		ctx.body = {message: 'success'};
    }catch(err){
        ctx.status = 500;
    }
})

// user logout - logout all -clear all tokens
userRouter.post('/users/logoutAll',auth(),async (ctx,next)=>{
    try  {
        ctx.user.tokens = [];
		await ctx.user.save();
		ctx.body = {message: 'success'};
    }catch(err){
        ctx.status = 500;
    }
})

module.exports = userRouter;