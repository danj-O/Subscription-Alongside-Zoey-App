const jwt = require('jsonwebtoken')

function verifyToken(req, res, next) {
  const bearerHeader = req.cookies.JWT
  // console.log("COOKIED TOKEN", req.cookies.JWT)
  // console.log('body', req.body)
  if (bearerHeader !== undefined){
    const bearerToken = bearerHeader.split(' ')[1]
    req.token = bearerToken
    // res.locals.path = req.body.status
    next()
  } else {
    // res.sendStatus(403); //forbidden
    console.log("auth failed/your cookie has expired")
    res.redirect('/login')
  }
}

module.exports = {
  verifyToken: verifyToken
}