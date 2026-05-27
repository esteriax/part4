const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', (request, response) => {
  Blog.find({}).then((blogs) => {
    response.json(blogs)
  })
})

blogsRouter.get('/:id', (request, response) => {
  Blog.findById(request.params.id).then((blog) => {
    response.json(blog)
  })
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

/*
const PORT = 3003
blogsRouter.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) */

module.exports = blogsRouter