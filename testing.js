var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session); 
var mysql = require('mysql');
var bkfd2Password = require("pbkdf2-password");

//var SESSION_SQL_options ={                                                
    //host: 'localhost',
    //port: 3000,
    //user: 'root',
    //password: '159753',
    //database: 'test'
//};
//var sessionStore = new MySQLStore(SESSION_SQL_options);


var sql_conn = mysql.createConnection({  //나중에 이부분은 server 기준으로 수정
    host     : 'localhost',
    user     : 'root',
    password : '159753',
    database : 'test'
  });
sql_conn.connect()
var app = express();
var hasher = bkfd2Password();


app.set('view engine', 'pug');
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({
    secret: '#1213215454$%',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
    //store : sessionStore
  }))



app.get('/form', function(req, res){
    if(!req.session.ID)  //session 에 id 가 없다면 로그인
    {
     res.render('login');
    }
    else
    {
     res.redirect('/welcome');
    }

  });

app.post('/form_receiver', function(req, res){    //sql 로부터 id pw 검사하는부분
   var user_IID = req.body.ID;
   var user_IPW = req.body.PW;
   
   var sql = 'SELECT IDN,PW  FROM topic' // 나중에 db name 수정
   sql_conn.query(sql,function(error, results, fields){
    if (error) throw error;

         var i = 0;
         var user_checker = false;
         var password = '';
         while(results[i]){
            if(results[i].IDN == user_IID){
                 console.log(results[i]);
                 hasher({password : user_IPW , salt : results[i].salt}, function(err, pass, salt, hash){
                    password = hash;
                       })
                 if(password == results[i].PW)
                 {
                     user_checker = true;
                     req.session.ID = user_IID;   /// 세션에 저장
                     req.session.PW = password;
                     break;
                 }
            }
            i = i+1;
        }
    if(user_checker){    
      res.redirect('/welcome');
    }
    else{
      res.redirect('/register');
    }

   })
  });
app.get('/welcome',function(req,res){
    console.log(req.session.ID);
    //if(req.session.ID){
     res.send('welcome'+req.session.ID);
    //}
    //else{                   //잘못된 접근 시 redirect로 로그인화면으로
    // res.redirect('/form');
   // }
   
})

app.get('/register',function(req,res){
   //////test 를 위해서 만든부분 나중에 frontend에서 다뤄야됨
   var test_o = `
   <html lang="en">
     <head>
        <meta charset="utf-8">
     </head>
     <body>
        <form action="/do_register">
          <input type="submit" value="register"><br><br><br><br><br>
        </form>
        <form  action="/fb_register">            
          <input type="submit" value="facebook">
        </form>
     </body>
  </html>
   `
   res.send(test_o);
   ///////////////////////////////////////////////////////
})
app.get('/do_register',function(req,res){
    ///////////나중에 front end 에서 수정
    var test_regis = `
    <html lang="en">
       <head>
         <meta charset="utf-8">
       </head>
       <body>
         <form action="/regit_load" method ="post" >
           <input type="text" name ="ID" placeholder="username"><br><br>
           <input type="text" name ="PW" placeholder="password"><br><br>
           <input type="submit" value="register">
         </form>
       </body>
    </html>
    `;
    res.send(test_regis);

})
app.post('/regit_load', function(req, res){    //sql 로부터 id 중복 검사하는부분
    var user_IID = req.body.ID;
    var user_IPW = req.body.PW;
    var salt_db = '';
    var user_IPW_db = '';

    hasher({password : user_IPW },function(err,pass,salt,hash){
      salt_db = salt;
      user_IPW_db = hash;
    })


    var user = [user_IID,user_IPW_db,salt_db]

    var sql = 'SELECT IDN FROM topic';// 나중에 db name 수정
    
    sql_conn.query(sql,function(error, results, fields){
        if (error) throw error;
        
        var i = 0;
        var isID = false;
        while(results[i]){
            if (results[i].IDN == user_IID){
                isID = true;
                break;
            }
            i = i+1;
        }
        if(isID){               //id 중복시 다시 회원가입창으로 
            res.redirect('/do_register')
        }
        else{
         var sql = 'INSERT INTO topic(IDN , PW , salt) VALUES(?,?,?)';///  암호비교를 위한 salt 값 저장이 필요
         sql_conn.query(sql,user,function(error, results, fields){
            if (error) throw error;
            res.redirect('/welcome')
         })

        }
    })
});

app.listen(3000, function(){
    console.log('Conneted 3000 port!');
});