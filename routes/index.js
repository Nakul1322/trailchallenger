const { Router } = require('express');
const router = Router();
const { verifyAccessToken } = require('../helpers/jwt_helper');

const authRoute = require('./auth');
const userRoute = require('./user');
const dashboardRoute = require('./dashboard');
const challengeRoute = require('./challenge');
const productRoute = require('./product');
const categoryRoute = require('./category');
const orderRoute = require('./order');
const cartRoute = require('./cart');
const cmsRoute = require('./cms');
const communityRoute = require('./community');
const contactusRoute = require('./contactus');
const redeemcodeRoute = require('./redeemcode');
const couponcodeRoute = require('./couponcode');
const notificationRoute = require('./notification');
const paymentRoute = require('./payment');
const redeemMedalRoute = require('./redeemmedal');
const guestUserRoute = require('./guestuser');
const sponsoredRoute = require('./sponsored');
const pinRoute = require('./pin');
const countryRoute = require('./country');
const announcementRoute = require('./announcement');
const watchNowRoute = require('./watchnow');

router.use('/auth', authRoute);
router.use(verifyAccessToken);
router.use('/cms', cmsRoute);
router.use('/challenge', challengeRoute);
router.use('/product', productRoute);
router.use('/community', communityRoute);
router.use('/guestuser', guestUserRoute);
router.use('/cart', cartRoute);
router.use('/contactus', contactusRoute);
router.use('/redeemcode', redeemcodeRoute);
router.use('/sponsored', sponsoredRoute);
router.use('/user', userRoute);
router.use('/dashboard', dashboardRoute);
router.use('/category', categoryRoute);
router.use('/order', orderRoute);
router.use('/couponcode', couponcodeRoute);
router.use('/notification', notificationRoute);
router.use('/payment', paymentRoute);
router.use('/redeemmedal', redeemMedalRoute);
router.use('/pin', pinRoute);
router.use('/country', countryRoute);
router.use('/announcement', announcementRoute);
router.use('/watchnow', watchNowRoute);


module.exports = router;

