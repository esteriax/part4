const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

//refaktorointi: async/await, virheenkäsittely, 404-virhekoodi, id:n tarkistus
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
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
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  })

  const savedBlog = await blog.save()
  response.status(201).json(savedBlog)
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
/*
const PORT = 3003
blogsRouter.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) */

module.exports = blogsRouter