const mongoose = require('mongoose')
require('dotenv').config()

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const url = process.env.MONGODB_URI

mongoose.set('strictQuery', false)
mongoose.connect(url, { family: 4 })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch(error => {
    console.log('error connecting to MongoDB:', error.message)
  })

const blogSchema = mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number,
})

const Blog = mongoose.model('Blog', blogSchema)

if (process.argv.length === 3) {
  console.log('bloglist:')
  Blog.find({}).then(result => {
    result.forEach(blog => {
      console.log(blog.title, blog.author, blog.url, blog.likes)
    })
    mongoose.connection.close()
  })
} else if (process.argv.length === 6) {
  const title = process.argv[3]
  const author = process.argv[4]
  const blogUrl = process.argv[5]

  const blog = new Blog({ title, author, url: blogUrl, likes: 0 })
  blog.save().then(() => {
    console.log(`added blog: ${title} by ${author}`)
    mongoose.connection.close()
  })
} else {
  console.log('usage: node mongo.js <password> [title] [author] [url]')
  mongoose.connection.close()
}