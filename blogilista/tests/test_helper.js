const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    title: 'Testi1',
    author: 'Kirjoittaja1',
    url: 'http://www.testi1.com',
    likes: 10
  },
  {
    title: 'Testi2',
    author: 'Kirjoittaja2',
    url: 'http://www.testi2.com',
    likes: 5
  }
]

const nonExistingId = async () => {
  const blog = new Blog({ 
    title: 'testi',
    author: 'testikirjoittaja',
    url: 'http://testi.com'
  })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}
const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialBlogs, nonExistingId, blogsInDb, usersInDb
}