const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
/* eslint-disable no-undef */
require('dotenv').config()


blogsRouter.post('/', async (request, response) => {
	const body = request.body

	const decodedToken = jwt.verify(request.token, process.env.SECRET)

	if (!request.token || !decodedToken.id) {
		return response.status(401).json({ error: 'token missing or invalid' })
	}
	const user = await User.findById(decodedToken.id)
	// const user = await User.findById(body.userId)

	const blog = new Blog({
		title: body.title,
		author: body.author,
		url: body.url,
		likes: body.likes === undefined ? 0 : body.likes,
		user: user._id
	})

	const savedBlog = await blog.save()
	user.blogs = user.blogs.concat(savedBlog._id)
	await user.save()
	response.json(savedBlog.toJSON())
})

blogsRouter.post('/:id/comments', async (request, response) => { 
	const body = request.body

	const blog = await Blog.findById(request.params.id);
	if (!blog) {
		return response.status(404).end()
	}

	const comment = body.comment
	blog.comments = blog.comments ? [...blog.comments, comment] : [comment]

	blog.save()
	response.status(200).end()

})

blogsRouter.get('/', async (request, response) => {
	const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
	response.json(blogs)
})

blogsRouter.put('/:id', async (request, response) => {
	const body = request.body

	const blog = {
		title: body.title,
		author: body.author,
		url: body.url,
		likes: body.likes,
	}

	await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
	response.status(200).end()
})

blogsRouter.delete('/:id', async (request, response) => {
	const decodedToken = jwt.verify(request.token, process.env.SECRET)

	if (!request.token || !decodedToken.id) {
		return response.status(401).json({ error: 'token missing or invalid' })
	}
	const userid = decodedToken.id
	const blog = await Blog.findById(request.params.id)
	if ( blog.user.toString() !== userid.toString() ){
		return response.status(401).json({ error: 'A blog can be deleted only by the user who added the blog' })
	}
	await Blog.findByIdAndRemove(request.params.id)
	return response.status(204).end()
})


module.exports = blogsRouter