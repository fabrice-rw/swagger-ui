const routes = require('./router/routes')//imports "routes.js" file to get all the routes
const express = require("express") //import of express packages I have been downloaded.
const mongoose = require("mongoose") //for mongoose
const cookieParser = require('cookie-parser')
const swaggerUI = require('swagger-ui-express')
const swaggerJsDoc = require('swagger-jsdoc')
const cors = require('cors')
const bodyParser = require('body-parser')

const PORT = process.env.PORT || 5000

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Back-end-with-swagger',
			description: 'Example of Create, Read, Update and Delete API ',
			version: '1.0.0',
		},
		components: {
			securitySchemes: {
				jwt: {
					type: 'http',
					scheme: 'bearer',
					in: 'header',
					bearerFormat: 'JWT'
				}
			}
		},
		security: [
			{
				jwt: []
			}
		],
		servers:[
			{
				url: "https://swagger-ui-production.up.railway.app"
			}
		],
	},
	// looks for configuration in specified directories
	apis: ['./router/*.js'],
}


const specs = swaggerJsDoc(options) //initialise swaggerJsDoc

const app = express()
//middlewares 
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
app.use(cors())
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs))
app.use(express.json())
app.use(cookieParser())
app.use(routes)
//app.use(express.bodyParser({limit: '50mb'}));

mongoose
	.connect('mongodb+srv://back-end-swagger:kigalirwanda@cluster0.ji5cp2g.mongodb.net/fa?retryWrites=true&w=majority', { useNewUrlParser: true })
	.then(async () => {
		await app.listen(PORT, () => {
			console.log("Server has started!")
		})
	}).catch((err) => {
		console.log(err)
	})

module.exports = { app }