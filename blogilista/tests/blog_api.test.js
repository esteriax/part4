const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

describe('fetching blogs', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')
    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })

  test('a specific title is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')
    const contents = response.body.map(e => e.title)
    assert(contents.includes('Testi1'))
  })

  test('blogs have id field instead of _id', async () => {
    const response = await api.get('/api/blogs')
    const blogs = response.body
    blogs.forEach(blog => {
      assert(blog.id)
      assert(!blog._id)
    })
  })

  test('a specific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToView = blogsAtStart[0]

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.deepStrictEqual(resultBlog.body, blogToView)
  })
})

describe('adding blogs', () => {
  test('a valid blog can be added', async () => {
    const newBlog = {
      title: 'Testi3',
      author: 'Kirjoittaja3',
      url: 'http://www.testi3.com',
      likes: 15
    }
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')
    const contents = response.body.map(r => r.title)
    assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)
    assert(contents.includes('Testi3'))
  })

  test('blog without title or url is not added', async () => {
    const newBlog = {
      author: 'Kirjoittaja3',
      likes: 15
    }
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

    const response = await helper.blogsInDb()
    assert.strictEqual(response.length, helper.initialBlogs.length)
  })

  test('if likes property is missing, it defaults to 0', async () => {
    const newBlog = {
      title: 'Testi4',
      author: 'Kirjoittaja4',
      url: 'http://www.testi4.com'
    }
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')
    const savedBlog = response.body.find(b => b.title === 'Testi4')
    assert.strictEqual(savedBlog.likes, 0)
  })
})

describe('deletion of a blog', () => {
  test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb()
    //console.log('blogeja alussa:', blogsAtStart.length)
    const blogToDelete = blogsAtStart[0]
    //console.log('poistettava:', blogToDelete)

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    const ids = blogsAtEnd.map(b => b.id)
    assert(!ids.includes(blogToDelete.id))
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
  })
  test('a blog that does not exist returns 404', async () => {
    const nonExistingId = await helper.nonExistingId()

    await api
      .delete(`/api/blogs/${nonExistingId}`)
      .expect(404)
  })
})

describe('updating a blog', () => {
  test('a blog can be updated', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const updatedBlog = {
      ...blogToUpdate,
      likes: blogToUpdate.likes + 1
    }

    const result = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(result.body.likes, blogToUpdate.likes + 1)
  })

  test('updating a non-existing blog returns 404', async () => {
    const nonExistingId = await helper.nonExistingId()

    await api
      .put(`/api/blogs/${nonExistingId}`)
      .send({ likes: 1 })
      .expect(404)
  })
})

after(async () => {
  await mongoose.connection.close()
})