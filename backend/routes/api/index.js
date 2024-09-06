// backend/routes/api/index.js

const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');
const csrfRouter = require('./csrf.js');

const { setTokenCookie } = require('../../utils/auth.js');
const { User } = require('../../db/models');
const { restoreUser } = require('../../utils/auth.js');
const { requireAuth } = require('../../utils/auth.js');

router.use(restoreUser);

router.use('/session', sessionRouter);

router.use('/users', usersRouter);

router.use('/csrf', csrfRouter);


router.get(
  '/restore-user',
  (req, res) => {
    return res.json(req.user);
  }
);

module.exports = router;
