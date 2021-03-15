// Load the core build.
var _ = require('lodash')

// eslint-disable-next-line no-unused-vars
const dummy = (blogs) => {
	return 1
}

const totalLikes = blogs => {
	const reducer = (sum, item) => {
		return sum + item.likes
	}
	return blogs.length === 0
		? 0
		: blogs.reduce(reducer, 0)
}

const favoriteBlog = blogs => {
	const findFav = (prev, current) =>
		(prev.likes > current.likes)
			? prev
			: current
	return blogs.length === 0
		? 0
		: blogs.reduce(findFav, 0)
}

const mostBlogs = blogs => {
	return blogs.length === 0
		? 0
		: {
			'author': _.maxBy(_.entries(_.countBy(blogs, 'author')), _.last)[0],
			'blogs': _.maxBy(_.entries(_.countBy(blogs, 'author')), _.last)[1]
		}
}

const mostLikes = blogs => {
	return blogs.length === 0
		? 0
		: {
			'author': _.maxBy(blogs, 'likes').author,
			likes : _.maxBy(blogs, 'likes').likes
		}

}

module.exports = {
	dummy,
	totalLikes,
	favoriteBlog,
	mostBlogs,
	mostLikes
}