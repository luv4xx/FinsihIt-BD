const Router =require('koa-router');
const auth = require('../middleware/auth');
const Todo = require('../models/todo');

const todoRouter = new Router({
	prefix: '/api'
});

// 在已登录用户名下创建todo
// creator=== login user
todoRouter.post('/todos',auth(),async (ctx,next)=>{
	const todo = new Todo({
		...ctx.request.body,
		creator: ctx.user._id
	});

	try {
		await todo.save();
		ctx.response.status = 201;
		ctx.body = todo;

	}catch(err){
		ctx.status=400;
		ctx.body = err;
	}	
})

// 取得已登录用户所创建的todos
// query查询
// {
//		completed: true | false => /todos?completed=true
//}
// 分页
// limit 一页展示的数量
// offset 起始位置
//排序
//sortBy: time:返回顺序
// 1 -> +  -1 => -
todoRouter.get('/todos',auth(), async (ctx,next)=>{
	const legalMatchProps=['completed'];
	const match={};
	Object.keys(ctx.query).forEach(q=>{
		if(legalMatchProps.includes(q)){
			match[q]=ctx.query[q];
		}
	})

	const sort={};
	if(ctx.query.sortBy){
		const [sortBy,order] = ctx.query.sortBy.split(':');
		sort[sortBy]=order==='desc'?-1:1; //默认是增序的
	}

	console.log(sort)
	try {
		// const todos = await Todo.find({});
		// console.log(parseInt(ctx.query.limit),parseInt(ctx.query.offset))
		await ctx.user.populate('todos').execPopulate({
			path: 'todos',
			match, // match obj
			options: {
				limit: parseInt(ctx.query.limit),
				skip: parseInt(ctx.query.offset),
				sort,
			},
			
		});
		ctx.body = ctx.user.todos;
	}catch(err){
		ctx.status=500;
	}
})


// 已登录的用户只能查询自己创建的todos
todoRouter.get('/todos/:id',auth(), async (ctx,next)=>{
	const _id = ctx.params.id;
	try {
		// const todo = await  Todo.findById(_id);
		const todo = await Todo.findOne({_id,creator:ctx.user._id})

		if(!todo) {
			ctx.status = 404;
			return;
		}

		ctx.body=todo;
	}catch(err){
		ctx.status = 500;
	}
})

todoRouter.patch('/todos/:id',auth(),async (ctx,next)=>{
	const _id = ctx.params.id;
	
	const legalProps = ["name","description","scheduleTime","completed","flag","createTime",]
	// const passed = updates.every((p)=> legalProps.includes(p))

	// if(!passed) {
	// 	ctx.status = 400;
	// 	ctx.body = {error: "invalid updates!"}
	// }
	// 只允许更新合法的prop
	const updates = Object.keys(ctx.request.body).filter((up)=>{
		return legalProps.includes(up);
	});

	try {
        // const todo = await Todo.findById(_id);
		const todo = await Todo.findOne({_id: _id,creator: ctx.user._id})

		if(!todo) {
			ctx.status=404;
			ctx.body='';
			return;
		}

        updates.forEach(p=>{
            todo[p] = ctx.request.body[p];
        })
        await todo.save();
		// const todo = await  Todo.findByIdAndUpdate(_id,ctx.request.body,{
		// 	new: true, //返回修改后的todo
		// 	runValidators: true // 修改时run validator
		// });
		// no find
		if(!todo) {
			ctx.status = 404;
			return;
		}

		ctx.body=todo;
	}catch(err){
		// 无法成功修改改id对应todo
		ctx.status = 400;
		ctx.body=err;
	}
})

todoRouter.delete('/todos/:id',auth(),async (ctx,next)=>{
	const _id = ctx.params.id;
	
	try {
		// const todo = await Todo.findByIdAndDelete(_id);
		const todo = await Todo.findOneAndDelete({_id: _id,creator: ctx.user._id})
		// no find
		if(!todo) {
			ctx.status = 404;
			return;
		}

		ctx.body=todo;
	}catch(err){
		ctx.status = 500;
	}
})


module.exports = todoRouter;