const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Todo = require('./todo');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: 'lazy man',
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlegnth: [8,'at least length 8'],
        lowercase: true,
        validate: [validator.isEmail,'email invalid!']
    },
    password: {
        type: String,
        required: true
    },
    tokens: [{ //token数组，每个token为string且required
        token: {
            type: String,
            required: true
        }
    }]
},{
    timestamps: true   // 创建默认的created & updated
})

// virtual props
// 表示models之间的关系 for mongoose
userSchema.virtual('todos',{
    ref: 'Todo', 
    localField: '_id', // local is User
    foreignField: 'creator', // foreign is Todo
    // LocalField === foreignField
    // user._id === todo.creator
})

// 通过 {password，email}来判断是否存在该用户
userSchema.statics.findByCredentials= async (email,password)=>{

    const user = await User.findOne({email});
    if(!user){
        // throw new Error('this user does not exist!')
        return null;
    }
    const isMatch = await bcrypt.compare(password,user.password);

    if(!isMatch) {
        throw new Error('wrong password!')
    }
    return user;
}



//挂在user上的method
userSchema.methods.generateJWT = async function(){
    const user =this;
    const token = jwt.sign({_id:user._id},'thisissecretforjwt');

    user.tokens = [...user.tokens,{token}];
    await user.save();
    return token;
}

// 隐藏不应该返回二定字段 比如password
// userSchema.methods.getPublicData = function(){
//     const user = this;
//     const publicUserData = user.toObject();
//     delete publicUserData.password;
//     delete publicUserData.tokens;

//     return publicUserData;
// }

// 重写本来会自动调用的方法来隐藏需要保密的字段
userSchema.methods.toJSON = function(){
    const user = this;
    const publicUserData = user.toObject();
    delete publicUserData.password;
    delete publicUserData.tokens;

    return publicUserData;
}

// 进入数据库前预先处理
userSchema.pre('save',async function(next){
    const user = this;
    if(user.isModified('password')){ // 已经加密过的password不再加密
        user.password = await bcrypt.hash(user.password,8);
    }

    next();
})

// 当用户已经注销后 删除这个注销用户创建的所有todo
// middleware will be called before user.remove()
userSchema.pre('remove',async function(next){
    const user =this;
    await Todo.deleteMany({creator: user._id});
    next();
})

const User = mongoose.model('User',userSchema)

module.exports = User;