const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item.likes
  }
  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length != 0) {
  return blogs.reduce((favorite, blog) => 
    blog.likes > favorite.likes ? blog : favorite
  )}
  else {
    return 0
  }
}

const mostBlogs = (blogs) => {
  const authors = {}
  blogs.forEach(blog => {
    if (authors[blog.author]) {
      authors[blog.author] += 1
    } else {
      authors[blog.author] = 1
    }
  })

  let mostBlogsAuthor = ''
  let mostBlogsCount = 0
  for (const [author, count] of Object.entries(authors)) {
    if (count > mostBlogsCount) {
      mostBlogsCount = count
      mostBlogsAuthor = author
    }
  }

  return {
    author: mostBlogsAuthor,
    blogs: mostBlogsCount
  }
}



module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
}