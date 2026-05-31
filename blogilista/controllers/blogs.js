const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

//refaktorointi: async/await, virheenkäsittely, 404-virhekoodi, id:n tarkistus
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

blogsRouter.post('/', async(request, response) => {
  const body = request.body
  const user = await User.findById(body.userId)

  if (!user) {
    return response.status(400).json({ error: 'userId missing or not valid' })
  }
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user._id
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
})
// debuggaus deleteOne() -> findByIdAndDelete(), 404-virhekoodi, id:n tarkistus 
blogsRouter.delete('/:id', async (request, response, next) => {
  try {
    const deleted = await Blog.findByIdAndDelete(request.params.id)
    if (!deleted) {
      return response.status(404).end()
    }
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

blogsRouter.put('/:id', async (request, response, next) => {
  const body = request.body
  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    if (!updatedBlog) {
      return response.status(404).end()
    }
    response.json(updatedBlog)
  } catch (error) {
    next(error)
  }
})

module.exports = blogsRouter