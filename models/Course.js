const mongoose = require('mongoose')
const Bootcamp = require('./Bootcamp')

const courseSchema = mongoose.Schema({
    title: {
        type: String,
        trim: true,
        unique: true,
        required: [true, 'Please add a course title'],
        maxlength: [50, 'description can not be more than 50 characters']
    },
    description:{
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [1000, 'description can not be more than 1000 characters']
    },
    bootcamp:{
        type: mongoose.Types.ObjectId,
        ref:'Bootcamp',
        required: true
    },
    weeks:{
        type: Number,
        required: [true, 'Please add a the course number of weeks'],
    },
    tuition: {
        type: Number,
        required: [true, 'Please add a tuition number']
    },
    minimumSkill: {
        type: String,
        default: "Beginner",
        enum:['Beginner', 'Intermediate','Advanced','All Levels' ]
    },
    scholarhipsAvailable: {
        type: Boolean,
        default: false
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},{
    timestamps: true
})

courseSchema.statics.CalcAverageCost = async function (bootcampId){
    try{
        const courses = await this.model('Course').find({ bootcamp: bootcampId })
        let sum = 0;
        courses.forEach( (course) => sum += course.tuition )
        const averageCost =  Math.ceil(sum / (courses.length))

        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, { averageCost },{
            new: true
        })
    } catch(error) { 
        console.log(error)
    }
}

courseSchema.post('save', async function(next){
    await this.constructor.CalcAverageCost(this.bootcamp)
})

courseSchema.post('remove', async function(next){
    await this.constructor.CalcAverageCost(this.bootcamp)
})

module.exports = mongoose.model('Course', courseSchema)