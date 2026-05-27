const assert = require('node:assert')
const { test, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

/*
On myös mahdollista suorittaa ainoastaan yhdessä tiedostossa määritellyt testit. Seuraava komento suorittaa ainoastaan tiedostossa tests/note_api.test.js olevat testit:
npm test -- tests/note_api.test.js

Parametrin --tests-by-name-pattern avulla voidaan suorittaa testejä nimen perusteella:
npm test -- --test-name-pattern="a specific note is within the returned notes"

arametri voi viitata testin tai describe-lohkon nimeen. Parametrina voidaan antaa myös nimen osa. Seuraava komento suorittaisi kaikki testit, joiden nimessä on sana notes:
npm run test -- --test-name-pattern="notes"
*/

beforeEach(async () => {
  await Blog.deleteMany({})
  let blogObject = new Blog(helper.initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(helper.initialBlogs[1])
  await blogObject.save()
})

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

test('a valid blog can be added ', async () => {
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

  // haetaan kaikki blogit, jotta varmistetaan että blogi ei ole tallentunut tietokantaan
  const response = await helper.blogsInDb()

  // varmistetaan, että tietokannassa on edelleen vain alkuperäiset blogit
  assert.strictEqual(response.length, helper.initialBlogs.length)
})

test('a specific blog can be viewed', async () => {
   const blogsAtStart = await helper.blogsInDb()
  console.log('blogit:', blogsAtStart) 
  const blogToView = blogsAtStart[0]
  console.log('haettava id:', blogToView.id)

  const resultBlog = await api
    .get(`/api/blogs/${blogToView.id}`)
    .expect(200)
    // varmistetaan, että palautettu data on JSON-muodossa
    .expect('Content-Type', /application\/json/)

  assert.deepStrictEqual(resultBlog.body, blogToView)
})

test('blogs have id field instead of _id', async () => {
  const response = await api.get('/api/blogs')
  const blogs = response.body
  blogs.forEach(blog => {
    assert(blog.id)
    assert(!blog._id)
  })
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

after(async () => {
  await mongoose.connection.close()
})