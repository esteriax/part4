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

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}