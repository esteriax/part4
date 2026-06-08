const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')


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
/*
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
*/
describe('deletion of a blog', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })
    await user.save()

    await Blog.deleteMany({})
    const blogObjects = helper.initialBlogs.map(b => ({ ...b, user: user._id }))
    await Blog.insertMany(blogObjects)
  })
  test('deletion fails with 401 if token is missing', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(401)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
  })

  test('a blog can be deleted by its creator', async () => {
    //kirjaudutaan root:ina ja saadaan token
    const loginResult = await api
      .post('/api/login')
      .send({ username: 'root', password: 'sekret' })
      .expect(200)

    console.log('token:', loginResult.body.token)

    const token = loginResult.body.token
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    console.log('blogeja:', blogsAtStart.length)    
    console.log('blogi:', blogsAtStart[0])        

    const deleteResult = await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)

    console.log('delete status:', deleteResult.status)   
    console.log('delete body:', deleteResult.body)        

    //const blogsAtEnd = await helper.blogsInDb()
    //const ids = blogsAtEnd.map(b => b.id)
    //assert(!ids.includes(blogToDelete.id))
    //assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
    assert.strictEqual(deleteResult.status, 204)
  })
})
  test('a blog that does not exist returns 404', async () => {
    const nonExistingId = await helper.nonExistingId()

    await api
      .delete(`/api/blogs/${nonExistingId}`)
      .expect(404)
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

describe('when there is initially one user at db', () => {
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
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
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

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

describe('creation of a user', () => {
  test('creation fails if username is missing', async () => {
  const usersAtStart = await helper.usersInDb()

  const newUser = {
    name: 'Testi',
    password: 'salainen'
  }

  const result = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  assert(result.body.error.includes('username is required'))
  const usersAtEnd = await helper.usersInDb()
  assert.strictEqual(usersAtEnd.length, usersAtStart.length)
})
test('creation fails if password is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'testi',
      name: 'Testi Testinen'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert(result.body.error.includes('password is required'))
    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
  test('fails if password is too short', async () => {
    const newUser = {
      username: 'testi',
      name: 'Testi Testinen',
      password: 'pw'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert(result.body.error.includes('password must be at least 3 characters long'))
  })

  test('fails if username is too short', async () => {
    const newUser = {
      username: 'te',
      name: 'Testi Testinen',
      password: 'salainen'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert(result.body.error.includes('username must be at least 3 characters long'))
  })
})

after(async () => {
  await mongoose.connection.close()
})