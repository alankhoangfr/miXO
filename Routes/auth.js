const express = require('express')
const pool = require("../dbpool")
const router = express.Router()
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')

// @route   POST api/auth
// @desc    Auth user
// @access  Public
router.post('/', (req, res) => {
    const { email, password } = req.body
  // Simple validation
    if(!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' })
    }
  // Check for existing user
    let sql = `SELECT * FROM user where email=${`"${email}"`}`
    let query = pool.query(sql, (err, user) => {
        if(err) throw err
        if(user.length===0){
            return res.status(400).json({ msg: 'User Does not exist' })
        }
        if(user.length===1){
            bcrypt.compare(password, user[0].password)
            .then(isMatch => {
                if(!isMatch) return res.status(400).json({ msg: 'Invalid credentials' })
                jwt.sign(
                    { id: user[0].id },
                    config.get('jwtSecret'),
                    { expiresIn: 3600 },
                    (err, token) => {
                        if(err) throw err
                        res.json({
                            token,
                            user: {
                            id: user[0].id,
                            email: user[0].email,
                            username: user[0].username,
                            access:user[0].access
                            }
                        })
                    }
                )
            })
        }
       
    })
})


// @route   GET api/auth/user
// @desc    Get user data
// @access  Private

router.get('/user', auth, (req, res) => {
    let sql = `SELECT id, email, username, access FROM user where id = ${req.user.id}`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err
        if(results.length===0){
            return res.status(400).json({ msg: 'User Does not exist' })
        }res.json(results)

    })
})

module.exports = router