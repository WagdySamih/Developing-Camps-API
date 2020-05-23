const mongooose = require('mongoose')

const reviewSchema = mongooose.Schema({
    title:{
        type: String,
        required: [true, 'Please provide the review title'],
        maxlength:50
    },
    text:{
        type: String,
        required: [true, 'Please provide the review body'],
        maxlength:1000
    },
    rating:{
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    bootcamp:{
        type: mongooose.Schema.Types.ObjectId,
        ref:'Bootcamp',
        required: true
    },
    user:{
        type: mongooose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    }
},{
    timestamps: true
})

/// calculate average rating per bootcamp
reviewSchema.statics.CalcAverageRating = async function (bootcampId){
    try{
        const reviews = await this.model('Review').find({ bootcamp: bootcampId })
        let sum = 0;
        reviews.forEach( (review) => sum += review.rating )
        const averageRating =  Math.ceil(sum / (reviews.length))

        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, { averageRating },{
            new: true
        })
    } catch(error) { 
        console.log(error)
    }
}

reviewSchema.post('save', async function(next){
    await this.constructor.CalcAverageRating(this.bootcamp)
})

reviewSchema.post('remove', async function(next){
     await this.constructor.CalcAverageRating(this.bootcamp)
})

module.exports = mongooose.model('Review', reviewSchema)