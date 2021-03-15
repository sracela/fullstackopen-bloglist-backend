const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const bcrypt = require('bcrypt')
const User = require('../models/user')
const Blog = require('../models/blog')

beforeEach(async () => {
	await Blog.deleteMany({})

	let blogObject = new Blog(helper.initialBlogs[0])
	await blogObject.save()

	blogObject = new Blog(helper.initialBlogs[1])
	await blogObject.save()

	blogObject = new Blog(helper.initialBlogs[2])
	await blogObject.save()
})


describe('when there is initially some blogs saved', () => {
	test('blogs are returned as json', async () => {
		await api
			.get('/api/blogs')
			.expect(200)
			.expect('Content-Type', /application\/json/)
	})

	test('all blogs are returned', async () => {
		const response = await api.get('/api/blogs')

		expect(response.body).toHaveLength(helper.initialBlogs.length)
	})


	test('all blogs have unique identifier property named id,', async () => {
		const response = await api.get('/api/blogs')
		const ids = response.body.map(r => r.id)
		expect(ids[0]).toBeDefined()
		expect(ids[1]).toBeDefined()
		expect(ids[2]).toBeDefined()

	})
})
describe('addition of a new blog', () => {

	beforeEach(async () => {
		await User.deleteMany({})

		const passwordHash = await bcrypt.hash('sekret', 10)
		const user = new User({ username: 'rootTest', passwordHash })
		await user.save()
	})
	test('a valid blog can be added', async () => {
		const login =
		{
			username: 'rootTest',
			password: 'sekret'
		}

		const responseLogin = await api
			.post('/api/login')
			.send(login)
			.expect(200)
			.expect('Content-Type', /application\/json/)

		const token = responseLogin.body.token
		const authToken = `bearer ${token}`

		const newBlog = {
			title: 'Created by rootTest',
			author: 'rot',
			url: 'prueba.com',
			likes: 2,
		}

		await api
			.post('/api/blogs')
			.send(newBlog)
			.set({ Authorization: authToken })
			.expect(200)
			.expect('Content-Type', /application\/json/)

		const blogsAtEnd = await helper.blogsInDb()
		expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
		const titles = blogsAtEnd.map(n => n.title)
		const authors = blogsAtEnd.map(n => n.author)
		const urls = blogsAtEnd.map(n => n.url)
		const likes = blogsAtEnd.map(n => n.likes)

		expect(titles).toContain(
			'Created by rootTest'
		)
		expect(authors).toContain(
			'rot'
		)
		expect(urls).toContain(
			'prueba.com'
		)
		expect(likes).toContain(
			2
		)
	})

	test('if likes property is missing from the request, it will default to the value 0', async () => {
		const login =
		{
			username: 'rootTest',
			password: 'sekret'
		}

		const responseLogin = await api
			.post('/api/login')
			.send(login)
			.expect(200)
			.expect('Content-Type', /application\/json/)

		const token = responseLogin.body.token
		const authToken = `bearer ${token}`

		const newBlog = {
			title: 'Prueba likes',
			author: 'saritdsaa',
			url: 'ñsaddsadapq.com'
		}

		await api
			.post('/api/blogs')
			.send(newBlog)
			.set({ Authorization: authToken })
			.expect(200)
			.expect('Content-Type', /application\/json/)

		const blogsAtEnd = await helper.blogsInDb()
		const blog_no_likes = blogsAtEnd.find(n => n.title === 'Prueba likes')
		expect(blog_no_likes.likes).toBe(0)
	})

	test(' if the title and url properties are missing from the request data, the backend responds to the request with the status code 400 Bad Request', async () => {
		const login =
		{
			username: 'rootTest',
			password: 'sekret'
		}

		const responseLogin = await api
			.post('/api/login')
			.send(login)
			.expect(200)
			.expect('Content-Type', /application\/json/)

		const token = responseLogin.body.token
		const authToken = `bearer ${token}`

		const newBlogNoTitle = {
			author: 'saritdsaa',
			url: 'ñsaddsadapq.com'
		}

		await api
			.post('/api/blogs')
			.send(newBlogNoTitle)
			.set({ Authorization: authToken })
			.expect(400)

		const newBlogNoUrl = {
			title: 'Prueba likes',
			author: 'saritdsaa'
		}

		await api
			.post('/api/blogs')
			.send(newBlogNoUrl)
			.set({ Authorization: authToken })
			.expect(400)
	})

	test('adding a blog fails with the proper status code 401 Unauthorized if a token is not provided', async () => {
		const newBlog = {
			title: 'Blog without auth',
			author: 'rot',
			url: 'prueba.com',
			likes: 60,
		}

		await api
			.post('/api/blogs')
			.send(newBlog)
			.set({ Authorization: 'whatever' })
			.expect(401)

	})
})

describe('deletion of a blog', () => {
	test('succeeds with status code 204 if id is valid', async () => {
		const blogsAtStart = await helper.blogsInDb()
		const blogToDelete = blogsAtStart[0]

		await api
			.delete(`/api/blogs/${blogToDelete.id}`)
			.expect(204)

		const blogsAtEnd = await helper.blogsInDb()

		expect(blogsAtEnd).toHaveLength(
			helper.initialBlogs.length - 1
		)

		const titles = blogsAtEnd.map(r => r.title)

		expect(titles).not.toContain(blogToDelete.title)
	})
})

describe('updating a blog', () => {
	test('succeeds with status code 200 if id is valid when adding likes to a post', async () => {
		const blogsAtStart = await helper.blogsInDb()
		const blogToUpdate = { ...blogsAtStart[0],
			likes: blogsAtStart[0].likes + 1 }

		await api
			.put(`/api/blogs/${blogToUpdate.id}`)
			.send(blogToUpdate)
			.expect(200)

		const blogsAtEnd = await helper.blogsInDb()

		expect(blogsAtEnd).toHaveLength(
			helper.initialBlogs.length
		)

		const updatedBlog = blogsAtEnd.find(r => r.id === blogToUpdate.id)
		expect(updatedBlog.likes).toBe(blogToUpdate.likes)
	})

})


describe('when there is initially one user in db', () => {
	beforeEach(async () => {
		await User.deleteMany({})

		const passwordHash = await bcrypt.hash('sekret', 10)
		const user = new User({ username: 'root', passwordHash })

		await user.save()
	})

	test('creation succeeds with a fresh username', async () => {
		const usersAtStart = await helper.usersInDb()

		const newUser = {
			username: 'mluukkai',
			name: 'Matti Luukkainen',
			password: 'salainen',
		}

		await api
			.post('/api/users')
			.send(newUser)
			.expect(200)
			.expect('Content-Type', /application\/json/)

		const usersAtEnd = await helper.usersInDb()
		expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

		const usernames = usersAtEnd.map(u => u.username)
		expect(usernames).toContain(newUser.username)
	})
	test('creation fails with proper statuscode and message if username already taken', async () => {
		const usersAtStart = await helper.usersInDb()

		const newUser = {
			username: 'root',
			name: 'Superuser',
			password: 'salainen',
		}

		const result = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/)

		expect(result.body.error).toContain('`username` to be unique')

		const usersAtEnd = await helper.usersInDb()
		expect(usersAtEnd).toHaveLength(usersAtStart.length)
	})
	test('creation fails with proper statuscode and message if username is too short', async () => {
		const usersAtStart = await helper.usersInDb()

		const newUser = {
			username: 'ro',
			name: 'Superuser',
			password: 'salainen',
		}

		const result = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/)

		console.log()

		expect(result.body.error).toContain('is shorter than the minimum allowed length')

		const usersAtEnd = await helper.usersInDb()
		expect(usersAtEnd).toHaveLength(usersAtStart.length)
	})
	test('creation fails with proper statuscode and message if password is too short', async () => {
		const usersAtStart = await helper.usersInDb()

		const newUser = {
			username: 'roooooo',
			name: 'Superuser',
			password: 'sa',
		}

		const result = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/)

		console.log()

		expect(result.body.error).toContain('password too small')

		const usersAtEnd = await helper.usersInDb()
		expect(usersAtEnd).toHaveLength(usersAtStart.length)
	})

})

afterAll(() => {
	mongoose.connection.close()
})