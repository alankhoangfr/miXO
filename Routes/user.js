const express = require("express")
const router = express.Router()
const pool = require("../dbpool")
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const app = express()
const axios = require("axios")
const auth = require('../middleware/auth')


router.post('/', auth,(req, res) => {
  const { username, email, password,access } = req.body
  // Simple validation
  if(!username || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' })
  }
  	const sqlUsername = `SELECT * FROM user where username=${`"${username}"`}`
	const sql = `SELECT * FROM user where email=${`"${email}"`}`
	let query = pool.query(sql, (err, results) => {
		if(err) throw err
		if(results.length===1) return res.status(400).json({ msg: 'Email already exists' })
		let queryUser = pool.query(sqlUsername, (err, results) => {
			if(err) throw err
			if(results.length===1) return res.status(400).json({ msg: 'Username already exists' })
			const newUser = {
				username,
				email,
				password,
				access
			}
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(newUser.password, salt, (err, hash) => {
					if(err) throw err
					newUser.password = hash
					let sql1 = `Insert INTO user set?`
					let query = pool.query(sql1,newUser,(err,nUser)=>{
						if(err) throw err;
						let query = pool.query(sqlUsername,(err,user)=>{
							if(err) throw err;
						})
					})	
				})
			})
		})	
	})
  // Check for existing user

})
module.exports = router