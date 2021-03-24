const mongoose = require('mongoose');
const validator = require('validator');

const todoSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },  
    scheduleTime:{
        type: String
    },
    completed:{
        type: Boolean,
        default: false,
    },
    flag:{
        type: Boolean,
        default: false,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId, //每个todo对应的创建者的_id
        required: true,
        ref: 'User' //refer to another mongoose model
    }
},{
    timestamps: true   // 创建默认的created & updated
})

todoSchema.pre('save',async function(next){
    const todo = this;
    console.log('exec middle')
   
    next();
})


const Todo = mongoose.model('Todo',todoSchema)

module.exports = Todo;