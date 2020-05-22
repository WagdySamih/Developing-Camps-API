const mongoose = require('mongoose')


mongoose.connect(process.env.MONGODB_URL,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then((connection)=>{
    console.log(`mongoDB is connected on ${connection.connection.host}`.green.inverse)
}).catch((error)=>{
    console.log('failed to connect to database'.red.inverse)
    process.exit(1)
})