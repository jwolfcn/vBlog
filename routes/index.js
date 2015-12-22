var express = require('express');
var router = express.Router();
var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comments.js')
    Category = require('../models/categories.js');

/* GET home page. */
router.get('/', function (req, res) {
  //判断是否是第一页，并把请求的页数转换成 number 类型
  var page = parseInt(req.query.p) || 1;
  //查询并返回第 page 页的 10 篇文章
  Post.getPost(null, page, function (err, posts, total) {
    if (err) {
      posts = [];
    }
    console.log("Posts--->"+JSON.stringify(posts));
    res.render('index', {
      title: '主页',
      posts: posts,
      page: page,
      isFirstPage: (page - 1) == 0,
      isLastPage: ((page - 1) * 10 + posts.length) == total,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  },10);
});

router.get('/register', checkNotLogin)
router.get('/register', function (req, res) {
  res.render('register', {
    title: 'Register',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
});
router.post('/register', function (req, res) {
  var name = req.body.name,
      password = req.body.password,
      password_re = req.body.verify;//如果变量中有-符号，可以用[]读取
  //检验用户两次输入的密码是否一致
  if (password_re != password) {
    req.flash('error', '两次输入的密码不一致!');
    return res.redirect('/register');//返回注册页
  }
  //生成密码的 md5 值
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  var newUser = new User({
    name: name,
    password: password,
    email: req.body.email
  });
  //检查用户名是否已经存在
  User.get(newUser.name, function (err, user) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    if (user) {
      console.log('用户已存在!');
      req.flash('error', '用户已存在!');
      return res.json({
        code:0,
        message:"用户已存在"
      });
      //return res.redirect('/register');//返回注册页
    }
    //如果不存在则新增用户
    newUser.save(function (err, user) {
      if (err) {
        req.flash('error', err);
        console.log('保存用户信息出错!');
        //return res.redirect('/register');//注册失败返回主册页
        return res.json({
          code:0,
          message:"保存用户信息出错"
        });
      }
      console.log("user---->"+JSON.stringify(user));
      req.session.user = user;//用户信息存入 session
      req.flash('success', '注册成功!正在跳转到主页');
      //res.redirect('/');//注册成功后返回主页
      return res.json({
        code:1,
        message:"注册成功",
        redirect:"/"
      });

    });
  });
});



router.get('/login', checkNotLogin);
router.get('/login', function (req, res) {
  res.render('login', {
    title: '登录',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()});
});
router.post('/login', function (req, res) {
  //生成密码的 md5 值
  console.log("Get Post!"+JSON.stringify(req.body));
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  //检查用户是否存在
  User.get(req.body.name, function (err, user) {
    if (!user) {
      req.flash('error', '用户不存在!');
      //return res.redirect('/login');//用户不存在则跳转到登录页
      return res.json({
        code:0,
        message: "用户不存在"});//用户不存在则跳转到登录页
    }
    //检查密码是否一致
    if (user.password != password) {
      //req.flash('error', '密码错误!');
      //return res.redirect('/login');//密码错误则跳转到登录页
      return res.json({
        code:0,
        message: "密码错误"
      });//密码错误则跳转到登录页
    }
    //用户名密码都匹配后，将用户信息存入 session
    req.session.user = user;
    req.flash('success', '登陆成功!');
    return res.json({
      redirect:'/',
      code:1,
      message: "登录成功"
    });
    //res.redirect('/');//登陆成功后跳转到主页
  });
});



router.get('/post',checkLogin)
router.get('/post', function (req, res) {
  res.render('post', {
    user: req.session.user,
    title: '发表'
  });
});
router.post('/post', checkLogin)
router.post('/post', function (req, res) {
  var currentUser = req.session.user,
      tags = [req.body.tag1, req.body.tag2, req.body.tag3],
      post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
    console.log("currentUser----->"+JSON.stringify(currentUser.name));
    post.save(function (err) {
    if (err) {
      req.flash('error', err);
      //return res.redirect('/');
      return res.json({
        code:0,
        message:"保存失败"
      });
    }
    req.flash('success', '发布成功!');
    //res.redirect('/');//发表成功跳转到主页
    return res.json({
      code:1,
      message:"保存成功",
      redirect:"/"
    });
  });
});


router.get('/logout', checkLogin)
router.get('/logout', function (req, res) {
  req.session.user = null;
  req.flash('success', '登出成功!');
  res.redirect('/');//登出成功后跳转到主页
});

router.get('/upload', checkLogin);
router.get('/upload', function (req, res) {
  console.log("upload");
  res.render('upload', {
    title: 'Upload',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
});
router.post('/upload', checkLogin);
router.post('/upload', function (req, res) {
  var files = req.files;
  console.log("files-->"+JSON.stringify(files['file1']));
  req.flash('success', '文件上传成功!'+files['file1'].path);
  res.redirect('/upload');
});

router.get('/u/:name', function (req, res) {
  var page = parseInt(req.query.p) || 1;
  //检查用户是否存在
  User.get(req.params.name, function (err, user) {
    if (!user) {
      req.flash('error', '用户不存在!');
      return res.redirect('/');
    }
    //查询并返回该用户第 page 页的 10 篇文章
    Post.getPost(user.name, page, function (err, posts, total) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      var temp = {
        title: user.name,
        posts: posts,
        page: page,
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 10 + posts.length) == total,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      };
      console.log("userData--->"+JSON.stringify(temp));
      res.render('user', temp);
    },10);
  });
});

router.get('/p/:_id', function (req, res) {
  console.log("get _id!");
  Post.getOne(req.params._id, function (err, post) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    console.log("post to article--->"+JSON.stringify(post));
    res.render('article', {
      title: post.title,
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});

router.get('/edit/:_id', checkLogin);
router.get('/edit/:_id', function (req, res) {
  var currentUser = req.session.user;
  Post.edit(req.params._id, function (err, post) {
    if (err) {
      req.flash('error', err);
      return res.redirect('back');
    }
    res.render('edit', {
      title: '编辑',
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});

router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function (req, res) {
  var currentUser = req.session.user;
  Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
    var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
    if (err) {
      req.flash('error', err);
      return res.redirect(url);//出错！返回文章页
    }
    req.flash('success', '修改成功!');
    res.redirect(url);//成功！返回文章页
  });
});

router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function (req, res) {
  var currentUser = req.session.user;
  Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
    if (err) {
      req.flash('error', err);
      return res.redirect('back');
    }
    req.flash('success', '删除成功!');
    res.redirect('/');
  });
});

router.post('/u/:name/:day/:title', function (req, res) {
  var date = new Date(),
      time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
          date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
  var md5 = crypto.createHash('md5'),
      email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
      head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
  var comment = {
    name: req.body.name,
    head: head,
    email: req.body.email,
    website: req.body.website,
    time: time,
    content: req.body.content
  };
  var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
  newComment.save(function (err) {
    if (err) {
      req.flash('error', err);
      //return res.redirect('back');
      return res.json({
        code:0,
        message:"留言失败"
      });
    }
    req.flash('success', '留言成功!');
    return res.json({
      code:1,
      message:"留言成功"
    });
    //res.redirect('back');
  });
});

router.get('/archive', function (req, res) {
  Post.getArchive(function (err, posts) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    console.log("getArchive--->"+posts);
    res.render('archive', {
      title: '存档',
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});

router.get('/tags', function (req, res) {
  Post.getTags(function (err, posts) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    res.render('tags', {
      title: '标签',
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});

router.get('/tags/:tag', function (req, res) {
  Post.getTag(req.params.tag, function (err, posts) {
    if (err) {
      req.flash('error',err);
      return res.redirect('/');
    }
    console.log("post---->"+JSON.stringify(posts));
    res.render('tag', {
      title: 'TAG:' + req.params.tag,
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});

router.get('/search', function (req, res) {
  Post.search(req.query.keyword, function (err, posts) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    res.render('search', {
      title: "SEARCH:" + req.query.keyword,
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});

router.get('/links', function (req, res) {
  res.render('links', {
    title: '友情链接',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
});
router.get('/contact', function (req, res) {
  res.render('contact', {
    title: '联系',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
});

router.get('/categoriesMgr', function (req, res) {
  res.render('categoriesMgr', {
    title: 'categoriesMgr',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
});

router.get('/categories/categories.json', function (req, res) {
  Category.getAll(function(err,categories){

  });
});


router.get('/reprint/:name/:day/:title', checkLogin);
router.get('/reprint/:name/:day/:title', function (req, res) {
  Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
    if (err) {
      req.flash('error', err);
      return res.redirect(back);
    }
    var currentUser = req.session.user,
        reprint_from = {name: post.name, day: post.time.day, title: post.title},
        reprint_to = {name: currentUser.name, head: currentUser.head};
    Post.reprint(reprint_from, reprint_to, function (err, p) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      console.log("post---->"+JSON.stringify(p));
      req.flash('success', '转载成功!');
      var url = encodeURI('/u/' + p.name + '/' + p.time.day + '/' + p.title);
      //跳转到转载后的文章页面
      res.redirect(url);
    });
  });
});
module.exports = router;


function checkLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', '未登录!');
    res.redirect('/login');
  }
  next();
}

function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', '已登录!');
    res.redirect('back');
  }
  next();
}
