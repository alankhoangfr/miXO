
  const mysql = require('mysql')


  // Database Connection for Development

  require('dotenv').config()


  //Local
   
  const pool = mysql.createPool({
    host: process.env.DB_HOST_LOCAL,
    user: process.env.DB_USER_LOCAL,
    database: process.env.DB_DATABASE_LOCAL,
    password: process.env.DB_PASS_LOCAL
  })


/*
  //Google SQL
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASS
  });
  */



  //Development

  pool.getConnection((err, connection) => {
  	if (err) {
  		if (err.code === 'PROTOCOL_CONNECTION_LOST') {
  			console.error('Database connection was closed.')
  		}
  		if (err.code === 'ER_CON_COUNT_ERROR') {
  			console.error('Database has too many connections.')
  		}
  		if (err.code === 'ECONNREFUSED') {
  			console.error('Database connection was refused.')
  		}
  	}	
  	if (connection) {
  		console.log('Connected');
  		connection.release()}
  	return
  })
  //



  /*
  //for production
  var config = {
      user: process.env.SQL_USER,
      database: process.env.SQL_DATABASE,
      password: process.env.SQL_PASSWORD
  }	

  if (process.env.INSTANCE_CONNECTION_NAME && process.env.NODE_ENV === 'production') {
      config.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
    }

  var pool = mysql.createConnection(config);

  pool.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }

    console.log('connected as id ' + pool.threadId);
  });
  


  //
*/

  module.exports = pool