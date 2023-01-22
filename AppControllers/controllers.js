const AdminSchema = require('../models/adminRegister')
const UserSchema = require('../models/userRegister')
const BlogsSchema = require('../models/blogs')
const PublishedBlogsSchema = require('../models/publishedBlogs')
const Coment = require('../models/commentSchema')
const Like = require('../models/likeSchema')
const Message = require('../models/contactMe')
const jwt = require('jsonwebtoken')


//Error handler function
const handleErrors = (err) => {
    //console.log(err.message, err.code)

    let flag = false
    const errors = { email: '', password: '' }

    // duplicate error code 
    if (err.code === 11000) {
        flag = true
        errors.email = 'That email is already registered'

        return [errors.email, flag]
    }

    //incorrect Email
    if (err.message === 'incorrect email') {
        errors.email = 'that email is not registered'
    }

    //incorrect password
    if (err.message === 'incorrect password') {
        errors.password = 'incorrect password'
    }

    //validation errors for admin
    if (err.message.includes('admin validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            console.log(properties)

            errors[properties.path] = properties.message
        })
    }

    //validation errors for comment
    if (err.message.includes('coment validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            console.log(properties)

            errors[properties.path] = properties.message
        })
    }

    //validation errors for user
    if (err.message.includes('user validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            console.log(properties)

            errors[properties.path] = properties.message
        })
    }

    //validation errors for create blog
    if (err.message.includes('Blog validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            console.log(properties)

            errors[properties.path] = properties.message
        })
    }

    return [errors, flag]
}

// Admin registering DB

module.exports.adminRegister = async (req, res) => {
    const { email, password } = req.body

    try {
        const admin = await AdminSchema.create({ email, password })

        console.log(admin)

        res.status(200).json({ "statusCode": 200, "message": 'Admin registration done successfully' })
    } catch (error) {
        const errors = handleErrors(error)
        if (errors[1]) {
            return res.status(400).json({ "statusCode": 400, "message": errors[0] })
        }
        else {
            res.status(400).json(errors)
        }

    }
}

//User registration
module.exports.userRegister = async (req, res) => {
    const { firstName, middleName, lastName, email, userPreference, phoneCountryCode, phone, password } = req.body

    try {
        const user = await UserSchema.create({ firstName, middleName, lastName, email, userPreference, phoneCountryCode, phone, password })

        console.log(user)

        // res.setHeader("Access-Control-Allow-Origin", "*")
        res.status(200).json({ "statusCode": 200, "message": 'Your registration done successfully' })
    } catch (error) {
        const errors = handleErrors(error)
        if (errors[1]) {
            // res.setHeader("Access-Control-Allow-Origin", "*")
            return res.status(400).json({ "statusCode": 400, "message": errors[0] })
        }
        else {
            
            // res.setHeader("Access-Control-Allow-Origin", "*")
            res.status(400).json(errors[0])
        }

    }
}


// jwt expireation time
const maxAge = 3 * 24 * 60 * 60  //thi is 3 days in seconds unlike cookie use time in milliseconds

//JWT creation for admin
const createAdminToken = (id) => {
    return jwt.sign({ id }, 'isiotaidigitalfafocal', {
        expiresIn: maxAge
    })
}

// JWT creation for logged in user
const createUserToken = (id) => {
    return jwt.sign({ id }, 'iotuserdigitalfocal', {
        expiresIn: maxAge
    })
}

module.exports.home = async (req, res) => {
    res.status(200).send('Home Page')
    //res.send("run")
}

//login a user 
module.exports.Userlogin_post = async (req, res) => {
    const { email, password } = req.body

    console.log(email, password )

    try {
        const user = await UserSchema.login(email, password)

        const token = createUserToken(user._id)
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })

        return res.status(200).json({ "statusCode": 200, "message": 'user log in succesful', "jwt": token, "userID": user._id })
    }
    catch (err) {
        const errors = handleErrors(err)
        return res.status(400).json({ "statusCode": 400, "message": errors })
    }
}

//login an admin
module.exports.Adminlogin_post = async (req, res) => {
    const { email, password } = req.body

    //console.log(email, password )

    try {
        const admin = await AdminSchema.login(email, password)

        const token = createAdminToken(admin._id)
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
        res.jwt = token

        //console.log(res.jwt)
        return res.status(200).json({ "statusCode": 200, "message": 'Admin log in succesful', 'jwt': token, "adminID": admin._id })
    }
    catch (err) {
        const errors = handleErrors(err)
        if(errors[0].email !== ""){
            return res.status(400).json({ 'statusCode': 400, 'message': { email: 'Your are not an admin' } })
        }
        else{
            return res.status(400).json({ 'statusCode': 400, 'message': errors[0] })
        }
    }
}

//user logout
module.exports.Userlogout_get = (req, res) => {
    res.cookie('jwt', '', { maxAge: 2000 })
    res.status(200).json({ "statusCode": 200, "message": "You are logged out successfully", "data": ["Home page"] })
    res.redirect('/')
}

// Get all user 
module.exports.allUsers = async (req, res) => {//creation of new 'GET' route with "router.get"
    try {
        const admin = await AdminSchema.find()
        const users = await UserSchema.find()

        res.status(200).json({ "statusCode": 200, "message": "Successfully", "data": { admin, users } })
    } catch (err) {
        const errors = handleErrors(err)
        if (errors[1]) {
            return res.status(404).send(errors[0])
        }
        else {
            res.status(404).send(errors)
        }
    }
}

// Get one user
module.exports.getOneUser = async (req, res) => {
    try {
        try {
            if (!req.params.id) {
                return res.status(400).json({ "StatusCode": 400, "message": "Please provide user id" })
            }
            const user = await UserSchema.findOne({
                _id: req.params.id
            })
            res.json({ "statusCode": 200, "message": "Successful", "data": user })
        } catch (error) {
            res.status(404)
            res.json({
                error: error.message
            })
        }
    } catch (error) {
        if (error) {
            const errors = handleErrors(error)
            return res.status(400).json({ 'statusCode': 400, 'message': "Invalid user id" })
        }
    }
}
//Delete one user
module.exports.deleteOneUser = async (req, res) => {
    try {
        const Deleted = await UserSchema.deleteOne({
            _id: req.params.id
        })

        //console.log(userToDel)

        if (Deleted.deletedCount !== 0) {
            res.status(200).json({ "statusCode": 200, "message": "Successful" })
        } else {
            res.status(404).json({ "statusCode": 404, "message": "User Not Found" })
        }
    } catch (error) {
        if (error) {
            const errors = handleErrors(error)
            return res.status(400).json({ 'statusCode': 400, 'message': "Invalid user id" })
        }
        //     res.status(400)
        //     res.send(
        //         { error: error.message }
        //   )
    }
}

//Delete all user
module.exports.deleteAllUser = async (req, res) => {
    try {
        await UserSchema.deleteMany()
        res.status(200).json({ "statusCode": 200, "message": "Successful" })
    } catch (error) {
        res.status(404)
        res.send(
            { error: error.message }
        )
    }
}

/************* CRUD op on blogs ***************/

module.exports.allBlogs = async (req, res) => {//creation of new 'GET' route with "router.get"
    try {
        const blogs = await BlogsSchema.find()
        res.json({ "statusCode": 200, "message": "Successfully", "data": blogs });
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

//Get one blog
module.exports.getOneBlog = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ "StatusCode": 400, "message": "Please provide blog id" })
        }
        const blog = await BlogsSchema.findOne({
            _id: req.params.id
        })
        res.json({ "statusCode": 200, "message": "Successful", "data": blog })
    } catch (error) {
        res.status(404)
        res.json({
            error: error.message
        })
    }
}

//create a blog
module.exports.createBlog = async (req, res) => {
    try {
        const blog = new BlogsSchema({
            title: req.body.title,
            author: req.body.author,
            content: req.body.content,
            imageUlr: req.body.imageUlr
        })
        await blog.save()
        res.status(201).json({ "statusCode": 201, "message": "Created successfully" })

    } catch (error) {
        console.log(error)
        const errors = handleErrors(error)
        return res.status(400).json({ 'statusCode': 400, 'message': errors })
        //res.status(400).json({ error: error.message })
    }
}

//update a blog
module.exports.updateBlog = async (req, res) => {
    try {
        const blog = await BlogsSchema.findOne({
            _id: req.params.id
        });

        if (req.body.title) {
            blog.title = req.body.title;
        }

        if (req.body.content) {
            blog.content = req.body.content
        }

        await blog.save()
        res.status(200).json({ "statusCode": 200, "message": "Updated Successfully" })
    } catch (error) {
        res.status(400)
        res.json({
            error: error.message
        })
    }
}

//Delete one blog
module.exports.deleteOneBlog = async (req, res) => {
    try {
        await BlogsSchema.deleteOne({
            _id: req.params.id
        })

        await PublishedBlogsSchema.deleteOne({
            _id: req.params.id
        })

        res.status(200).json({ "statusCode": 200, "message": "Deleted Successfully" })
    } catch (error) {
        res.status(400)
        res.json({
            error: error.message
        })
    }
}

//Delete all blogs
module.exports.deleteAllBlogs = async (req, res) => {
    try {
        await BlogsSchema.deleteMany()
        res.status(200).json({ "statusCode": 200, "message": "All deleted Successfully" })
    } catch (error) {
        res.status(400)
        res.json({
            error: error.message
        })
    }
}

// Published blogs
module.exports.publishBlog = async (req, res) => {
    try {
        const publishedBlog = new PublishedBlogsSchema({
            title: req.body.title,
            author: req.body.author,
            content: req.body.content,
            imageUlr: req.body.imageUlr
        })
        await publishedBlog.save()

        const blog = new BlogsSchema({
            title: req.body.title,
            author: req.body.author,
            content: req.body.content,
            imageUlr: req.body.imageUlr
        })
        await blog.save()

        return res.status(201).json({ "statusCode": 201, "message": "Created successfully" })

    } catch (error) {
        const errors = handleErrors(error)
        return res.status(400).json({ 'statusCode': 400, 'message': errors })
    }
}

// Get all published blogs
module.exports.publishedBlogs = async (req, res) => {//creation of new 'GET' route with "router.get"
    try {
        const publishedBlogs = await PublishedBlogsSchema.find()
        res.json({ "statusCode": 200, "message": "Successfully", "data": publishedBlogs });
    } catch (error) {
        res.status(400).json({ "statusCode": 200, "message": error.message })
    }
}

//Coment

module.exports.coment = async (req, res) => {

    console.log(req.body)

    const { blogId, userId, comentData } = req.body

    try {
        const coment = await Coment.create({ blogId, userId, comentData })
        return res.status(201).json({"statusCode": 201, "message": "Coment created", "data": [ coment ]})
    } catch (error) {
        // const errors = handleErrors(error)
        // if (errors[1]) {
        //     return res.status(400).json({ "statusCode": 400, "message": errors[0] })
        // }
        // else {
        //     res.status(400).json(errors)
        // }

        console.log("Error Ocurs", error)
    }
}

// Get all coments

module.exports.allComents = async (req, res) => {
    try {
        const allComents = await Coment.find()
        return res.status(200).json({
            'statusCode': 200,
            'message': 'Successful',
            'data': allComents
        })
    } catch (error) {
        return res.status(404).json({
            'statusCode': 404,
            'message': error.message
        })
    }
}
//like

module.exports.like = async (req, res) => {
    const { blogId, likerId } = req.body

    let likeFromDB = await Like.find()
   
    try {
        if(likeFromDB[0] === undefined){//this means that there are not at least one blog liked
            console.log('Not one I have to create one with: ', { blogId,  likerId })
            await Like.create({ blogId,  likerId })
            likeFromDB = await Like.find()
            likeFromDB[0]['likersIds'].push(likerId)
            await Like.create(likeFromDB)
            return res.status(201).json({"statusCode": 201, "message": "liked", "data": (await Like.find())})
        }
        else{
            //console.log('initial value', likeFromDB)
            let indexOfLiker
            let removed
            for(let i = 0; i < likeFromDB.length; i++){
                for(const property in likeFromDB[i]){
                    if(likeFromDB[i]['blogId'] === blogId){
                        console.log(likeFromDB[i]['likersIds'])

                        likeFromDB[i]['likersIds'].map( (savedLikerId) => {
                            indexOfLiker = likeFromDB[i]['likersIds'].indexOf(likerId)
                            console.log(indexOfLiker)
                            if(savedLikerId === likerId){
                                removed = likeFromDB[i]['likersIds'].splice(indexOfLiker, 1)
                            }
                        })

                        console.log('the remaining length is :', likeFromDB[i]['likersIds'].length)
                        
                        //likeFromDB[i]['likersIds'].push(likerId)
                        console.log("the removed value is :" ,removed)
                        if((removed !== undefined) && (likeFromDB[i]['likersIds'].length !== 0)){
                            await Like.create(likeFromDB)
                            return res.status(201).json({"statusCode": 201, "message": "like added to already liked blog", "data": (await Like.find())})    
                        }
                    }
                    console.log('before deleting a null likes',likeFromDB)
                    if(likeFromDB[i]['likersIds'].length === 0){
                        await Like.deleteOne({ blogId: likeFromDB[i]['blogId']   })
                        return res.status(201).json({"statusCode": 201, "message": "like added to already liked blog", "data": (await Like.find())})    
                    }
                    console.log("the removed value is :" ,removed)
                    if((removed === undefined) && (indexOfLiker === -1)){
                        likeFromDB[i]['likersIds'].push(likerId)
                        await Like.create(likeFromDB)
                        return res.status(201).json({"statusCode": 201, "message": "like added to already liked blog", "data": (await Like.find())})
                    }
                }
            }

            await Like.create({ blogId,  likerId })
            likeFromDB = await Like.find()
            //console.log('The length is : ',likeFromDB.length)
            likeFromDB[likeFromDB.length -1 ]['likersIds'].push(likerId)
            await Like.create(likeFromDB)
            return res.status(201).json({"statusCode": 201, "message": "liked", "data": (await Like.find())})

        }
 
    } catch (error) {
        console.log("Error Ocurs", error)
    }
}

// Get all likes
module.exports.allLikes = async (req, res) => {
    try {
        const allLikes = await Like.find()
        return res.status(200).json({
            'statusCode': 200,
            'message': 'Successful',
            'data': allLikes
        })
    } catch (error) {
        return res.status(404).json({
            'statusCode': 404,
            'message': error.message
        })
    }
}

//Delete all likes
module.exports.deleteAllLikes = async (req, res) => {
    try {
        await Like.deleteMany()
        res.status(200).json({ "statusCode": 200, "message": "Successful" })
    } catch (error) {
        res.status(404)
        res.send(
            { error: error.message }
        )
    }
}

// Send message
module.exports.saveMessage = async (req, res) => {
    
    const { fullname, email, phoneNumber, UserMessage } = req.body

    try {
        const message = await Message.create({ fullname, email, phoneNumber, UserMessage })
        return res.status(200).json({ 'statusCode': 200, 'message': 'Message sent', 'data': (await Message.find())})
    } catch (error) {
        console.log(error)
        return res.status(400).send(error)
    }
}

// Get all messages from users
module.exports.messageFromUsers = async (req, res) => {
    try {
        const messages = await Message.find()
        return res.status(200).json({ 'statusCode': 200, 'message': 'Successfully', 'data': messages})
    } catch (error) {
        return res.status(404).send(error)
    }
}